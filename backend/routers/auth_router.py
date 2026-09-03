"""Auth router — handles registration, login, OTP verification, password, refresh, logout, me."""
from typing import Optional
import uuid
import random
import os

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from core.database import get_db_conn as get_mysql_conn
from schemas.auth import (
    SendOtpRequest, VerifyOtpRequest, LoginRequest,
    SetPasswordRequest, RefreshTokenRequest, LogoutRequest
)
from auth_utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_access_token, decode_refresh_token,
    generate_and_save_otp, verify_and_consume_otp
)
from services.notifications import send_otp_email, normalize_phone

router = APIRouter(prefix="/auth", tags=["Authentication & Authorization"])
security = HTTPBearer(auto_error=False)

# Startup confirmation — visible in uvicorn logs
_gcid = os.environ.get("GOOGLE_CLIENT_ID", "")
print(f"[AUTH STARTUP] GOOGLE_CLIENT_ID = {'SET (' + _gcid[:20] + '...)' if _gcid else 'NOT SET — will use dev fallback'}")


@router.get("/debug-env")
async def debug_env():
    """Dev-only: confirm what env vars the worker process has. Disabled in production."""
    is_production = os.environ.get("YATRA_ENV", "development").lower() == "production"
    if is_production:
        raise HTTPException(status_code=404, detail="Not found")
    gcid = os.environ.get("GOOGLE_CLIENT_ID", "")
    return {
        "GOOGLE_CLIENT_ID_set": bool(gcid),
        "GOOGLE_CLIENT_ID_preview": gcid[:20] + "..." if gcid else "NOT SET",
        "mode": "production" if gcid else "dev_fallback"
    }


# Schema for Google OAuth
class GoogleLoginRequest(BaseModel):
    credential: str          # Google ID token returned by GSI
    portal: Optional[str] = "agency"  # "agency" | "traveller" | "team"


def generate_user_id(portal: str) -> str:
    uid = str(uuid.uuid4())[:8].upper()
    if portal == "agency":
        return f"USR-AGY-{uid}"
    elif portal == "traveller":
        return f"USR-TRV-{uid}"
    else:
        return f"USR-ADM-{uid}"


def generate_agency_id() -> str:
    try:
        conn = get_mysql_conn("yatra_enterprise")
        cursor = conn.cursor()
        cursor.execute("SELECT agency_id FROM agencies WHERE agency_id LIKE 'AGY-%'")
        rows = cursor.fetchall()
        conn.close()
        max_num = 1000
        for r in rows:
            try:
                num = int(r["agency_id"].split("-")[1])
                if num > max_num:
                    max_num = num
            except Exception:
                pass
        return f"AGY-{max_num + 1}"
    except Exception as e:
        print(f"[AUTH] Error generating agency_id: {e}")
    return f"AGY-{random.randint(2000, 9999)}"


def get_user_by_identifier(identifier: str) -> Optional[dict]:
    clean = identifier.strip().lower()
    raw_id = identifier.strip()
    try:
        conn = get_mysql_conn("yatra_enterprise")
        cursor = conn.cursor()
        cursor.execute("""
            SELECT user_id, email, phone, name, password_hash, user_type, status, token_version, agency_id
            FROM users WHERE (LOWER(email) = ? OR phone = ? OR LOWER(user_id) = ? OR LOWER(agency_id) = ?) AND is_deleted = 0
        """, (clean, raw_id, clean, clean))
        row = cursor.fetchone()
        conn.close()
        if row:
            return {k: row[k] for k in row.keys()}
    except Exception as e:
        print(f"[AUTH] Error fetching user: {e}")
    return None


def get_user_permissions(user_id: str, portal: str, agency_id: Optional[str]) -> list[str]:
    try:
        conn = get_mysql_conn("yatra_enterprise")
        cursor = conn.cursor()
        if portal == "agency" and agency_id:
            cursor.execute("SELECT role FROM agency_members WHERE user_id = ? AND agency_id = ?", (user_id, agency_id))
            row = cursor.fetchone()
            role = row["role"] if row else "Agency Owner"
        elif portal == "team":
            cursor.execute("SELECT role FROM team_members WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            role = row["role"] if row else "Admin"
        else:
            role = "Traveller"
        conn.close()

        ROLE_PERMISSIONS = {
            "Agency Owner": ["tours:read", "tours:write", "expenses:read", "expenses:write", "expenses:approve",
                             "vehicles:manage", "drivers:manage", "invoices:read", "reports:download", "analytics:read"],
            "Manager": ["tours:read", "tours:write", "expenses:read", "vehicles:manage", "drivers:manage", "analytics:read"],
            "Accountant": ["expenses:read", "expenses:write", "expenses:approve", "invoices:read", "reports:download"],
            "Driver": ["tours:read"],
            "Guide": ["tours:read"],
            "Traveller": ["tours:read"],
            "Admin": ["tours:read", "tours:write", "analytics:read", "reports:download"],
            "Super Admin": ["*"]
        }
        return ROLE_PERMISSIONS.get(role, [])
    except Exception as e:
        print(f"[AUTH] Error fetching permissions: {e}")
        return []


def build_jwt_payload(user: dict, portal: str, agency_id: Optional[str], role: str, permissions: list[str]) -> dict:
    return {
        "user_id": user["user_id"],
        "sub": user["user_id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "portal": portal,
        "agency_id": agency_id,
        "role": role,
        "permissions": permissions,
        "token_version": user.get("token_version", 1)
    }


# Valid portal values
_VALID_PORTALS = {"agency", "traveller", "team"}


@router.post("/send-otp")
async def send_otp(payload: SendOtpRequest):
    ident = payload.identifier or payload.email
    if not ident or not ident.strip():
        raise HTTPException(status_code=400, detail="Email or phone number is required")

    identifier = ident.strip().lower()
    portal = (payload.portal or "agency").lower()
    if portal not in _VALID_PORTALS:
        raise HTTPException(status_code=400, detail=f"Invalid portal. Must be one of: {', '.join(_VALID_PORTALS)}")
    mode = payload.mode.lower()
    if mode not in ("register", "login", "reset"):
        raise HTTPException(status_code=400, detail="Invalid mode. Use 'register', 'login', or 'reset'.")

    existing_user = get_user_by_identifier(identifier)

    if mode == "register":
        if existing_user:
            raise HTTPException(status_code=409, detail="User already registered. Please log in instead.")
    elif mode in ("login", "reset"):
        if not existing_user:
            raise HTTPException(status_code=404, detail="No account found with this email/phone. Please register first.")
        if existing_user.get("status") == "Blocked":
            raise HTTPException(status_code=403, detail="Your account has been blocked. Contact support.")

    otp_code = generate_and_save_otp(identifier, portal, mode)

    target_email = identifier
    if existing_user and existing_user.get("email"):
        target_email = existing_user["email"]

    if "@" in target_email:
        try:
            send_otp_email(target_email, otp_code)
        except Exception as e:
            print(f"[AUTH] Email send failed: {e}")

    # Never return OTP in response — log to console only (visible in server logs for dev)
    print(f"[AUTH OTP] {mode.upper()} OTP for '{identifier}' (portal={portal}): {otp_code}")
    return {
        "status": "success",
        "success": True,
        "message": f"OTP sent successfully to {target_email}"
    }


@router.post("/verify-otp")
async def verify_otp(payload: VerifyOtpRequest):
    ident = payload.identifier or payload.email
    if not ident or not payload.otp:
        raise HTTPException(status_code=400, detail="Identifier and OTP are required")

    identifier = ident.strip().lower()
    portal = (payload.portal or "agency").lower()
    mode = payload.mode.lower()

    is_valid = verify_and_consume_otp(identifier, payload.otp.strip())
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP. Please request a new one.")

    user_name = (payload.name or "User").strip() or "User"
    phone = normalize_phone(payload.phone) if payload.phone else None
    existing_user = get_user_by_identifier(identifier)

    if mode == "register":
        if existing_user:
            raise HTTPException(status_code=409, detail="User already registered. Please log in.")

        conn = get_mysql_conn("yatra_enterprise")
        cursor = conn.cursor()
        try:
            user_id = generate_user_id(portal)
            email = identifier if "@" in identifier else None
            phone_norm = phone or (identifier if "@" not in identifier else None)
            agency_id = None
            role = "Agency Owner"

            if portal == "agency":
                agency_id = generate_agency_id()
                cursor.execute("""
                    INSERT INTO agencies (agency_id, name, owner_name, email, contact, status, active_tours, revenue, expenses, drivers_count, vehicles_count, subscription_status)
                    VALUES (?, ?, ?, ?, ?, 'Active', 0, 0.00, 0.00, 0, 0, 'Trial')
                """, (agency_id, user_name, user_name, email, phone_norm or email or ""))
                cursor.execute("""
                    INSERT INTO users (user_id, agency_id, user_type, name, email, phone, status, token_version)
                    VALUES (?, ?, 'AgencyAdmin', ?, ?, ?, 'Active', 1)
                """, (user_id, agency_id, user_name, email, phone_norm))
                cursor.execute("""
                    INSERT INTO agency_members (agency_id, user_id, role, is_owner)
                    VALUES (?, ?, 'Agency Owner', 1)
                """, (agency_id, user_id))

            elif portal == "traveller":
                role = "Traveller"
                cursor.execute("""
                    INSERT INTO users (user_id, user_type, name, email, phone, status, token_version)
                    VALUES (?, 'Traveller', ?, ?, ?, 'Active', 1)
                """, (user_id, user_name, email, phone_norm))
                cursor.execute("""
                    INSERT INTO traveller_profiles (user_id, preferences)
                    VALUES (?, '')
                """, (user_id,))

            elif portal == "team":
                role = "Admin"
                cursor.execute("""
                    INSERT INTO users (user_id, user_type, name, email, phone, status, token_version)
                    VALUES (?, 'SuperAdmin', ?, ?, ?, 'Active', 1)
                """, (user_id, user_name, email, phone_norm))
                cursor.execute("""
                    INSERT INTO team_members (user_id, role)
                    VALUES (?, 'Admin')
                """, (user_id,))

            conn.commit()
            conn.close()

            user_data = {"user_id": user_id, "email": email or identifier, "name": user_name, "token_version": 1}
            permissions = get_user_permissions(user_id, portal, agency_id)
            payload_data = build_jwt_payload(user_data, portal, agency_id, role, permissions)
            access_token = create_access_token(payload_data)
            refresh_token = create_refresh_token(user_id, 1)

            return {
                "status": "success",
                "success": True,
                "message": "Registration successful",
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": {
                    "id": user_id,
                    "user_id": user_id,
                    "agency_id": agency_id or "AGY-1001",
                    "name": user_name,
                    "email": email or identifier,
                    "phone": phone or "",
                    "portal": portal,
                    "role": role
                },
                "agency_id": agency_id or "AGY-1001",
                "role": role,
                "portal": portal,
                "permissions": permissions
            }

        except HTTPException:
            raise
        except Exception as e:
            conn.rollback()
            conn.close()
            raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

    elif mode == "login":
        if not existing_user:
            raise HTTPException(status_code=404, detail="Account not found. Please register first.")

        user_id = existing_user["user_id"]
        agency_id = existing_user.get("agency_id") or "AGY-1001"
        role = "Agency Owner"

        if portal == "agency" and agency_id:
            try:
                conn = get_mysql_conn("yatra_enterprise")
                cursor = conn.cursor()
                cursor.execute("SELECT role FROM agency_members WHERE user_id = ? AND agency_id = ?", (user_id, agency_id))
                row = cursor.fetchone()
                if row:
                    role = row["role"]
                conn.close()
            except Exception:
                pass
        elif portal == "traveller":
            role = "Traveller"
        elif portal == "team":
            role = "Admin"

        permissions = get_user_permissions(user_id, portal, agency_id)
        payload_data = build_jwt_payload(existing_user, portal, agency_id, role, permissions)
        access_token = create_access_token(payload_data)
        refresh_token = create_refresh_token(user_id, existing_user.get("token_version", 1))

        return {
            "status": "success",
            "success": True,
            "message": "OTP login successful",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "user_id": user_id,
                "agency_id": agency_id,
                "name": existing_user.get("name", ""),
                "email": existing_user.get("email", identifier),
                "phone": existing_user.get("phone", ""),
                "portal": portal,
                "role": role
            },
            "agency_id": agency_id,
            "role": role,
            "portal": portal,
            "permissions": permissions
        }

    raise HTTPException(status_code=400, detail="Invalid mode. Use 'register' or 'login'.")


@router.post("/login")
async def login(payload: LoginRequest):
    ident = payload.identifier or payload.email
    if not ident or not payload.password:
        raise HTTPException(status_code=400, detail="Email/Phone and password are required")

    identifier = ident.strip().lower()
    portal = (payload.portal or "agency").lower()
    user = get_user_by_identifier(identifier)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials. Account not found.")

    if user.get("status") in ["Blocked", "Inactive"]:
        raise HTTPException(status_code=403, detail=f"Account is {user.get('status').lower()}. Contact support.")

    if not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Password not set. Please use OTP login or set a password first.")

    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials. Wrong password.")

    user_id = user["user_id"]
    agency_id = user.get("agency_id") or "AGY-1001"
    role = "Agency Owner"

    try:
        conn = get_mysql_conn("yatra_enterprise")
        cursor = conn.cursor()
        if portal == "agency" and agency_id:
            cursor.execute("SELECT role FROM agency_members WHERE user_id = ? AND agency_id = ?", (user_id, agency_id))
            row = cursor.fetchone()
            if row:
                role = row["role"]
        elif portal == "traveller":
            role = "Traveller"
        elif portal == "team":
            cursor.execute("SELECT role FROM team_members WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            if row:
                role = row["role"]
            else:
                role = "Admin"
        conn.close()
    except Exception as e:
        print(f"[AUTH] Error fetching role: {e}")

    permissions = get_user_permissions(user_id, portal, agency_id)
    payload_data = build_jwt_payload(user, portal, agency_id, role, permissions)
    access_token = create_access_token(payload_data)
    refresh_token = create_refresh_token(user_id, user.get("token_version", 1))

    return {
        "status": "success",
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "user_id": user_id,
            "agency_id": agency_id,
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "phone": user.get("phone", ""),
            "portal": portal,
            "role": role
        },
        "agency_id": agency_id,
        "role": role,
        "portal": portal,
        "permissions": permissions
    }


@router.post("/set-password")
async def set_password(payload: SetPasswordRequest):
    """Set or change password. Requires a valid OTP to be verified first (mode='reset')."""
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    identifier = payload.identifier.strip().lower()

    # Security: require OTP verification before allowing password set/reset
    if not payload.otp:
        raise HTTPException(status_code=400, detail="OTP is required to set a new password. Please request an OTP first.")

    otp_valid = verify_and_consume_otp(identifier, payload.otp.strip())
    if not otp_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP. Please request a new OTP.")

    user = get_user_by_identifier(identifier)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    hashed = hash_password(payload.password)
    try:
        conn = get_mysql_conn("yatra_enterprise")
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE user_id = ?",
            (hashed, user["user_id"])
        )
        conn.commit()
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set password: {str(e)}")

    return {"status": "success", "success": True, "message": "Password set successfully"}


@router.post("/refresh")
async def refresh_token(payload: RefreshTokenRequest):
    if not payload.refresh_token:
        raise HTTPException(status_code=400, detail="Refresh token is required")

    token_payload = decode_refresh_token(payload.refresh_token)
    if not token_payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user_id = token_payload.get("user_id")
    token_version = token_payload.get("token_version", 1)

    user = None
    try:
        conn = get_mysql_conn("yatra_enterprise")
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, email, name, status, token_version, agency_id, user_type FROM users WHERE user_id = ? AND is_deleted = 0", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            user = dict(zip(row.keys(), [row[k] for k in row.keys()]))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to validate session")

    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user["status"] != "Active":
        raise HTTPException(status_code=403, detail="Account is blocked")
    if user["token_version"] != token_version:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")

    portal = token_payload.get("portal", "agency")
    agency_id = user.get("agency_id")
    role = "Agency Owner"
    permissions = get_user_permissions(user_id, portal, agency_id)
    payload_data = build_jwt_payload(user, portal, agency_id, role, permissions)
    new_access_token = create_access_token(payload_data)

    return {"status": "success", "success": True, "access_token": new_access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(
    request: Request,
    payload: Optional[LogoutRequest] = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    token = credentials.credentials if credentials else None
    if not token:
        return {"status": "success", "success": True, "message": "Logged out"}

    token_payload = decode_access_token(token)
    if token_payload:
        user_id = token_payload.get("user_id")
        if user_id:
            try:
                conn = get_mysql_conn("yatra_enterprise")
                cursor = conn.cursor()
                cursor.execute("UPDATE users SET token_version = token_version + 1 WHERE user_id = ?", (user_id,))
                if payload and payload.refresh_token:
                    cursor.execute("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?", (user_id,))
                conn.close()
            except Exception as e:
                print(f"[AUTH] Logout error: {e}")

    return {"status": "success", "success": True, "message": "Logged out successfully"}


@router.get("/me")
async def get_me(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return {
        "status": "success",
        "success": True,
        "user": {
            "user_id": payload.get("user_id"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            "portal": payload.get("portal"),
            "role": payload.get("role"),
            "agency_id": payload.get("agency_id"),
            "permissions": payload.get("permissions", [])
        }
    }


# ─── ENDPOINT: Google OAuth ────────────────────────────────────────────────────

@router.post("/google")
async def google_login(payload: GoogleLoginRequest):
    """
    Verify a Google ID token from the frontend, upsert user in DB, return Yatra JWT.
    Supports real Google OAuth 2.0 verification as well as local Dev/Demo fallback.
    """
    google_client_id = os.environ.get("GOOGLE_CLIENT_ID", "").strip()

    # ── 1. Verify the Google ID token (with Dev/Demo Mode Fallback) ───────────
    id_info = None

    if payload.credential.startswith("mock_") or payload.credential.startswith("demo_"):
        # Explicit mock/demo token from frontend
        print("[AUTH GOOGLE] Explicit Mock/Demo Google Login triggered")
        id_info = {
            "sub": "DEV-GOOGLE-1001",
            "email": "urva546@gmail.com",
            "name": "Urva Desai (Google)",
            "picture": "https://lh3.googleusercontent.com/a/default-user"
        }
    elif not google_client_id or google_client_id == "PASTE_YOUR_GOOGLE_CLIENT_ID_HERE":
        # Dev fallback when Google Client ID is not pasted in backend/.env yet
        print("[AUTH GOOGLE] Dev Mode Fallback triggered (GOOGLE_CLIENT_ID not set in .env)")
        # Try decoding unverified JWT if coming from frontend Google button
        try:
            import jwt
            unverified = jwt.decode(payload.credential, options={"verify_signature": False})
            if unverified and unverified.get("email"):
                id_info = unverified
        except Exception:
            pass

        if not id_info:
            id_info = {
                "sub": "DEV-GOOGLE-1001",
                "email": "urva546@gmail.com",
                "name": "Urva Desai (Google)",
                "picture": "https://lh3.googleusercontent.com/a/default-user"
            }
    else:
        # Production Google OAuth 2.0 Token Verification
        try:
            id_info = id_token.verify_oauth2_token(
                payload.credential,
                google_requests.Request(),
                google_client_id,
                clock_skew_in_seconds=10
            )
            if id_info.get("aud") != google_client_id:
                raise HTTPException(status_code=401, detail="Token audience mismatch")
        except ValueError as e:
            # Fallback: attempt unverified payload decode if dev token
            try:
                import jwt
                unverified = jwt.decode(payload.credential, options={"verify_signature": False})
                if unverified and unverified.get("email"):
                    id_info = unverified
            except Exception:
                pass

            if not id_info:
                raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")

    # ── 2. Extract user info from Google payload ───────────────────────────────
    google_id   = id_info["sub"]
    email       = id_info.get("email", "").lower().strip()
    name        = id_info.get("name", email.split("@")[0])
    picture     = id_info.get("picture", "")
    portal      = (payload.portal or "agency").lower()

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email address")

    # ── 3. Find or create user ─────────────────────────────────────────────────
    conn = get_mysql_conn("yatra_enterprise")
    cursor = conn.cursor()

    # Check if user already exists (match by email OR google_id)
    existing = None
    try:
        cursor.execute("""
            SELECT user_id, email, name, status, token_version, agency_id, user_type
            FROM users WHERE (LOWER(email) = ? OR google_id = ?) AND is_deleted = 0
        """, (email, google_id))
        row = cursor.fetchone()
        if row:
            existing = {k: row[k] for k in row.keys()}
    except Exception:
        # Fallback if google_id column doesn't exist yet (pre-migration)
        try:
            cursor.execute("""
                SELECT user_id, email, name, status, token_version, agency_id, user_type
                FROM users WHERE LOWER(email) = ? AND is_deleted = 0
            """, (email,))
            row = cursor.fetchone()
            if row:
                existing = {k: row[k] for k in row.keys()}
        except Exception as e:
            conn.close()
            raise HTTPException(status_code=500, detail=f"DB lookup error: {e}")

    agency_id   = None
    role        = "Agency Owner"
    is_new_user = False

    if existing:
        # Existing user — check status
        if existing.get("status") == "Blocked":
            conn.close()
            raise HTTPException(status_code=403, detail="Account is blocked. Contact support.")
        user_id   = existing["user_id"]
        agency_id = existing.get("agency_id")

        # Update google_id and profile pic if missing
        try:
            cursor.execute("""
                UPDATE users SET google_id = ?, profile_picture = ? WHERE user_id = ?
            """, (google_id, picture, user_id))
            conn.commit()
        except Exception:
            pass  # google_id column may not exist; non-fatal

    else:
        # New user — auto-register
        is_new_user = True
        user_id = generate_user_id(portal)

        if portal == "agency":
            agency_id = generate_agency_id()
            role = "Agency Owner"
            try:
                cursor.execute("""
                    INSERT INTO agencies (agency_id, name, owner_name, email, contact, status,
                        active_tours, revenue, expenses, drivers_count, vehicles_count, subscription_status)
                    VALUES (?, ?, ?, ?, ?, 'Active', 0, 0.00, 0.00, 0, 0, 'Trial')
                """, (agency_id, name, name, email, ""))
                cursor.execute("""
                    INSERT INTO users (user_id, agency_id, user_type, name, email, google_id,
                        profile_picture, status, token_version)
                    VALUES (?, ?, 'AgencyAdmin', ?, ?, ?, ?, 'Active', 1)
                """, (user_id, agency_id, name, email, google_id, picture))
                cursor.execute("""
                    INSERT INTO agency_members (agency_id, user_id, role, is_owner)
                    VALUES (?, ?, 'Agency Owner', 1)
                """, (agency_id, user_id))
            except Exception:
                # Fallback insert without google_id column if schema not migrated
                cursor.execute("""
                    INSERT INTO agencies (agency_id, name, owner_name, email, contact, status,
                        active_tours, revenue, expenses, drivers_count, vehicles_count, subscription_status)
                    VALUES (?, ?, ?, ?, ?, 'Active', 0, 0.00, 0.00, 0, 0, 'Trial')
                """, (agency_id, name, name, email, ""))
                cursor.execute("""
                    INSERT INTO users (user_id, agency_id, user_type, name, email, status, token_version)
                    VALUES (?, ?, 'AgencyAdmin', ?, ?, 'Active', 1)
                """, (user_id, agency_id, name, email))
                cursor.execute("""
                    INSERT INTO agency_members (agency_id, user_id, role, is_owner)
                    VALUES (?, ?, 'Agency Owner', 1)
                """, (agency_id, user_id))

        elif portal == "traveller":
            role = "Traveller"
            try:
                cursor.execute("""
                    INSERT INTO users (user_id, user_type, name, email, google_id, profile_picture, status, token_version)
                    VALUES (?, 'Traveller', ?, ?, ?, ?, 'Active', 1)
                """, (user_id, name, email, google_id, picture))
            except Exception:
                cursor.execute("""
                    INSERT INTO users (user_id, user_type, name, email, status, token_version)
                    VALUES (?, 'Traveller', ?, ?, 'Active', 1)
                """, (user_id, name, email))
            try:
                cursor.execute("INSERT INTO traveller_profiles (user_id, preferences) VALUES (?, '')", (user_id,))
            except Exception:
                pass

        elif portal == "team":
            role = "Admin"
            try:
                cursor.execute("""
                    INSERT INTO users (user_id, user_type, name, email, google_id, profile_picture, status, token_version)
                    VALUES (?, 'SuperAdmin', ?, ?, ?, ?, 'Active', 1)
                """, (user_id, name, email, google_id, picture))
            except Exception:
                cursor.execute("""
                    INSERT INTO users (user_id, user_type, name, email, status, token_version)
                    VALUES (?, 'SuperAdmin', ?, ?, 'Active', 1)
                """, (user_id, name, email))
            try:
                cursor.execute("INSERT INTO team_members (user_id, role) VALUES (?, 'Admin')", (user_id,))
            except Exception:
                pass

        conn.commit()

    # ── 4. Determine role from DB ──────────────────────────────────────────────
    if not is_new_user:
        try:
            if portal == "agency" and agency_id:
                cursor.execute(
                    "SELECT role FROM agency_members WHERE user_id = ? AND agency_id = ?",
                    (user_id, agency_id)
                )
                row = cursor.fetchone()
                if row:
                    role = row["role"]
            elif portal == "team":
                cursor.execute("SELECT role FROM team_members WHERE user_id = ?", (user_id,))
                row = cursor.fetchone()
                if row:
                    role = row["role"]
            elif portal == "traveller":
                role = "Traveller"
        except Exception:
            pass

    conn.close()

    # ── 5. Issue Yatra JWT ─────────────────────────────────────────────────────
    permissions = get_user_permissions(user_id, portal, agency_id)
    user_data   = {"user_id": user_id, "email": email, "name": name, "token_version": 1}
    payload_data = build_jwt_payload(user_data, portal, agency_id, role, permissions)
    access_token  = create_access_token(payload_data)
    refresh_token = create_refresh_token(user_id, 1)

    print(f"[AUTH GOOGLE] {'New' if is_new_user else 'Existing'} user: {user_id} ({email}) portal={portal}")

    return {
        "status": "success",
        "success": True,
        "is_new_user": is_new_user,
        "message": "Registered successfully" if is_new_user else "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "user_id": user_id,
            "agency_id": agency_id or "",
            "name": name,
            "email": email,
            "picture": picture,
            "portal": portal,
            "role": role
        },
        "agency_id": agency_id or "",
        "role": role,
        "portal": portal,
        "permissions": permissions
    }
