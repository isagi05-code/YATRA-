from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List
from auth_utils import decode_access_token
from core.database import get_db_conn as get_mysql_conn

security = HTTPBearer(auto_error=False)


class AuthUser:
    def __init__(self, user_id: str, email: str, name: str, portal: str, role: str,
                 agency_id: Optional[str] = None, permissions: Optional[List[str]] = None):
        self.user_id = user_id
        self.email = email
        self.name = name
        self.portal = portal
        self.role = role
        self.agency_id = agency_id
        self.permissions = permissions or []

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "email": self.email,
            "name": self.name,
            "portal": self.portal,
            "role": self.role,
            "agency_id": self.agency_id,
            "permissions": self.permissions,
        }


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> AuthUser:
    """
    Decodes and validates the JWT from the Authorization: Bearer header.

    SECURITY: There is intentionally no fallback path here. A request with a
    missing, malformed, or invalid token is always rejected with 401 — it must
    never be treated as an authenticated user with default/mock identity.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("user_id") or payload.get("sub")
    token_version = payload.get("token_version", 1)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify the user still exists, is active, and this token hasn't been
    # invalidated by a logout / password change (token_version bump).
    # Any failure here is a hard 401/403 — never a fallback identity.
    conn = get_mysql_conn("yatra_enterprise")
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT user_id, email, name, status, token_version FROM users WHERE user_id = ?",
            (user_id,),
        )
        user_row = cursor.fetchone()
    finally:
        conn.close()

    if not user_row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found.")
    if user_row["status"] != "Active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive or blocked.")
    if user_row["token_version"] != token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired due to password change or logout. Please log in again.",
        )

    return AuthUser(
        user_id=user_id,
        email=payload.get("email") or user_row["email"],
        name=user_row["name"],
        portal=payload.get("portal", "agency"),
        role=payload.get("role", "Agency Owner"),
        agency_id=payload.get("agency_id"),
        permissions=payload.get("permissions", []),
    )


# ── Portal-scoped dependencies ──────────────────────────────────────────────
# Routers depend on these instead of accepting agency_id/user_id as client-
# supplied query params. The identifier always comes from the verified JWT.

def require_agency_context(current_user: AuthUser = Depends(get_current_user)) -> AuthUser:
    if current_user.portal != "agency":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This endpoint is only available to agency accounts.")
    if not current_user.agency_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is not associated with an agency.")
    return current_user


def get_agency_id(current_user: AuthUser = Depends(require_agency_context)) -> str:
    return current_user.agency_id


def require_traveller_context(current_user: AuthUser = Depends(get_current_user)) -> AuthUser:
    if current_user.portal != "user":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This endpoint is only available to traveller accounts.")
    return current_user


def get_user_id(current_user: AuthUser = Depends(require_traveller_context)) -> str:
    return current_user.user_id


def require_team_context(current_user: AuthUser = Depends(get_current_user)) -> AuthUser:
    if current_user.portal != "yatra-team":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This endpoint is only available to Yatra team admin accounts.")
    return current_user