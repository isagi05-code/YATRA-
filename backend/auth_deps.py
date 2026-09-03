from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List
from auth_utils import decode_access_token
from core.database import get_db_conn as get_mysql_conn

security = HTTPBearer(auto_error=False)


class AuthUser:
    def __init__(self, user_id: str, email: str, name: str, portal: str, role: str, agency_id: Optional[str] = None, permissions: Optional[List[str]] = None):
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
            "permissions": self.permissions
        }


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> AuthUser:
    """
    Decodes JWT token from Authorization Bearer header.
    Validates token expiration, user active status, and token_version.
    Returns AuthUser object with user_id, agency_id, role, portal, permissions.

    SECURITY: No unauthenticated fallback — every request MUST supply a valid Bearer token.
    """
    token = None
    if credentials:
        token = credentials.credentials
    else:
        # Fallback to manual Authorization header parse (handles non-standard clients)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify user in database — hard failure, no silent fallback
    try:
        conn = get_mysql_conn("yatra_enterprise")
        cursor = conn.cursor()
        cursor.execute(
            "SELECT user_id, email, name, status, token_version FROM users WHERE user_id = ?",
            (user_id,)
        )
        user_row = cursor.fetchone()
        conn.close()
    except Exception as e:
        print(f"[AUTH_DEPS] DB error during token validation: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service temporarily unavailable. Please try again.",
        )

    if not user_row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found")

    if user_row["status"] != "Active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive or blocked")

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
        permissions=payload.get("permissions", [])
    )


def require_agency_id_context(request: Request, current_user: AuthUser = Depends(get_current_user)) -> str:
    """
    CRITICAL SECURITY REQUIREMENT:
    Backend MUST NOT trust agency_id coming directly from client query/body if JWT contains agency_id.
    Extract agency_id from JWT payload. Fallback to query param only if JWT has no agency_id (e.g. team admins).
    """
    if current_user.agency_id:
        return current_user.agency_id

    # Fallback to query param ONLY when JWT does not contain an agency_id
    # (e.g. a team admin scoping to a specific agency for admin operations)
    query_aid = request.query_params.get("agency_id")
    if query_aid:
        return query_aid

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="agency_id is required but could not be determined from your session. Please log in again."
    )
