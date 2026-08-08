"""Auth router — handles registration, login, OTP verification, password, refresh, logout, me."""
from typing import Optional
import uuid
import random

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

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
        cursor.execute("SELECT agency_id FROM agencies WHERE agency_id LIKE 'AGY-%' ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        if row:
            last_num = int(row["agency_id"].split("-")[1])
            return f"AGY-{last_num + 1}"
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


@router.post("/send-otp")
async def send_otp(payload: SendOtpRequest):
    ident = payload.identifier or payload.email
    if not ident or not ident.strip():
        raise HTTPException(status_code=400, detail="Email or phone number is required")

    identifier = ident.strip().lower()
    portal = (payload.portal or "agency").lower()
    mode = payload.mode.lower()
    existing_user = get_user_by_identifier(identifier)

    if mode == "register":
        if existing_user:
            raise HTTPException(status_code=409, detail="User already registered. Please log in instead.")
    elif mode == "login":
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

    print(f"[AUTH OTP] {mode.upper()} OTP for '{identifier}' (portal={portal}): {otp_code}")
    return {
        "status": "success",
        "success": True,
        "message": f"OTP sent successfully to {target_email}",
        "otp": otp_code
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
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    identifier = payload.identifier.strip().lower()
    user = get_user_by_identifier(identifier)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    hashed = hash_password(payload.password)
    try:
        conn = get_mysql_conn("yatra_enterprise")
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password_hash = ?, token_version = token_version + 1 WHERE user_id = ?", (hashed, user["user_id"]))
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
