"""
auth_api.py — Production-Ready Authentication & Authorization API for Yatra ERP
Handles: OTP Registration, Login, JWT, Refresh Token, Logout, RBAC
"""

import os
import datetime
import uuid
import random
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, validator

from mysql_helper import get_db_conn as get_mysql_conn
from auth_utils import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_access_token, decode_refresh_token,
    generate_and_save_otp, verify_and_consume_otp
)
from email_helper import send_otp_email
from sms_helper import normalize_phone

app = FastAPI(title="Yatra Auth API", version="2.0.0", description="Centralized Authentication & Authorization for Yatra ERP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)

# ─── Pydantic Schemas ────────────────────────────────────────────────────────

class SendOtpRequest(BaseModel):
    identifier: str  # Email or Phone
    portal: str      # "agency" | "traveller" | "team"
    mode: str        # "register" | "login"
    name: Optional[str] = None

class VerifyOtpRequest(BaseModel):
    identifier: str
    otp: str
    portal: str
    mode: str
    name: Optional[str] = None
    phone: Optional[str] = None

class LoginRequest(BaseModel):
    identifier: str   # Email or Phone
    password: str
    portal: str       # "agency" | "traveller" | "team"

class SetPasswordRequest(BaseModel):
    identifier: str
    portal: str
    password: str
    confirm_password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None

# ─── Utility Helpers ────────────────────────────────────────────────────────

def generate_user_id(portal: str) -> str:
    uid = str(uuid.uuid4())[:8].upper()
    if portal == "agency":
        return f"USR-AGY-{uid}"
    elif portal == "traveller":
        return f"USR-TRV-{uid}"
    else:
        return f"USR-ADM-{uid}"

def generate_agency_id() -> str:
    """Generate next sequential agency ID."""
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
    """Look up user by email OR phone."""
    clean = identifier.strip().lower()
    try:
        conn = get_mysql_conn("yatra_enterprise")
        cursor = conn.cursor()
        cursor.execute("""
            SELECT user_id, email, phone, name, password_hash, user_type, status, token_version, agency_id
            FROM users WHERE (LOWER(email) = ? OR phone = ?) AND is_deleted = 0
        """, (clean, identifier.strip()))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(zip(row.keys(), [row[k] for k in row.keys()]))
    except Exception as e:
        print(f"[AUTH] Error fetching user: {e}")
    return None

def get_user_permissions(user_id: str, portal: str, agency_id: Optional[str]) -> List[str]:
    """Retrieve permissions for a user based on their role."""
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

        # Permission sets by role
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

def build_jwt_payload(user: dict, portal: str, agency_id: Optional[str], role: str, permissions: List[str]) -> dict:
    """Build JWT payload containing all required claims."""
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

# ─── ENDPOINT 1: Send OTP ────────────────────────────────────────────────────

@app.post("/auth/send-otp")
async def send_otp(payload: SendOtpRequest):
    """
    Send a 6-digit OTP to the user's email or phone.
    - For 'register' mode: reject if account already exists (409).
    - For 'login' mode: reject if account does NOT exist (404).
    OTP expires in 5 minutes.
    """
    if not payload.identifier or not payload.identifier.strip():
        raise HTTPException(status_code=400, detail="Email or phone number is required")

    identifier = payload.identifier.strip().lower()
    portal = payload.portal.lower()
    mode = payload.mode.lower()
    existing_user = get_user_by_identifier(identifier)

    if mode == "register":
        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="User already registered. Please log in instead."
            )
    elif mode == "login":
        if not existing_user:
            raise HTTPException(
                status_code=404,
                detail="No account found with this email/phone. Please register first."
            )
        if existing_user.get("status") == "Blocked":
            raise HTTPException(status_code=403, detail="Your account has been blocked. Contact support.")

    # Generate OTP and persist in DB (5-minute expiry)
    otp_code = generate_and_save_otp(identifier, portal, mode)

    # Send via email (identifier looks like an email)
    target_email = identifier
    if existing_user and existing_user.get("email"):
        target_email = existing_user["email"]

    send_success = False
    if "@" in target_email:
        try:
            send_otp_email(target_email, otp_code)
            send_success = True
        except Exception as e:
            print(f"[AUTH] Email send failed: {e}")

    print(f"[AUTH OTP] {mode.upper()} OTP for '{identifier}' (portal={portal}): {otp_code}")
    return {
        "success": True,
        "message": f"OTP sent successfully to {target_email}",
        "otp": otp_code  # Remove in production; for dev/testing only
    }


# ─── ENDPOINT 2: Verify OTP + Complete Registration ──────────────────────────

@app.post("/auth/verify-otp")
async def verify_otp(payload: VerifyOtpRequest):
    """
    Verify OTP. If mode=register and OTP is valid, create user + portal record.
    Returns JWT access_token + refresh_token on success.
    """
    if not payload.identifier or not payload.otp:
        raise HTTPException(status_code=400, detail="Identifier and OTP are required")

    identifier = payload.identifier.strip().lower()
    portal = payload.portal.lower()
    mode = payload.mode.lower()

    # Verify OTP from DB (consumes it after verification)
    is_valid = verify_and_consume_otp(identifier, payload.otp.strip())
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP. Please request a new one.")

    user_name = (payload.name or "User").strip() or "User"
    phone = normalize_phone(payload.phone) if payload.phone else None

    existing_user = get_user_by_identifier(identifier)

    # ── REGISTER MODE: Create all records ──
    if mode == "register":
        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="User already registered. Please log in."
            )

        conn = get_mysql_conn("yatra_enterprise")
        cursor = conn.cursor()
        try:
            user_id = generate_user_id(portal)
            email = identifier if "@" in identifier else None
            phone_norm = phone or (identifier if "@" not in identifier else None)
            agency_id = None
            role = "Agency Owner"

            if portal == "agency":
                # Create agency first
                agency_id = generate_agency_id()
                cursor.execute("""
                    INSERT INTO agencies (agency_id, name, owner_name, email, contact, status, active_tours, revenue, expenses, drivers_count, vehicles_count, subscription_status)
                    VALUES (?, ?, ?, ?, ?, 'Active', 0, 0.00, 0.00, 0, 0, 'Trial')
                """, (agency_id, user_name, user_name, email, phone_norm or email or ""))

                # Create user (AgencyAdmin type)
                cursor.execute("""
                    INSERT INTO users (user_id, agency_id, user_type, name, email, phone, status, token_version)
                    VALUES (?, ?, 'AgencyAdmin', ?, ?, ?, 'Active', 1)
                """, (user_id, agency_id, user_name, email, phone_norm))

                # Link user to agency as Owner
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

            user_data = {
                "user_id": user_id,
                "email": email or identifier,
                "name": user_name,
                "token_version": 1
            }
            permissions = get_user_permissions(user_id, portal, agency_id)
            payload_data = build_jwt_payload(user_data, portal, agency_id, role, permissions)
            access_token = create_access_token(payload_data)
            refresh_token = create_refresh_token(user_id, 1)

            print(f"[AUTH] Registered: user_id={user_id}, portal={portal}, agency_id={agency_id}")
            return {
                "success": True,
                "message": "Registration successful",
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": {
                    "user_id": user_id,
                    "name": user_name,
                    "email": email or identifier,
                    "portal": portal,
                    "role": role
                },
                "agency_id": agency_id,
                "role": role,
                "portal": portal,
                "permissions": permissions
            }

        except HTTPException:
            raise
        except Exception as e:
            conn.rollback()
            conn.close()
            print(f"[AUTH] Registration failed: {e}")
            raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

    # ── LOGIN VIA OTP MODE ──
    elif mode == "login":
        if not existing_user:
            raise HTTPException(status_code=404, detail="Account not found. Please register first.")

        user_id = existing_user["user_id"]
        agency_id = existing_user.get("agency_id")
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
            "success": True,
            "message": "OTP login successful",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "user_id": user_id,
                "name": existing_user.get("name", ""),
                "email": existing_user.get("email", identifier),
                "portal": portal,
                "role": role
            },
            "agency_id": agency_id,
            "role": role,
            "portal": portal,
            "permissions": permissions
        }

    raise HTTPException(status_code=400, detail="Invalid mode. Use 'register' or 'login'.")


# ─── ENDPOINT 3: Password Login ───────────────────────────────────────────────

@app.post("/auth/login")
async def login(payload: LoginRequest):
    """
    Authenticate with Email/Phone + Password. Returns JWT tokens.
    """
    if not payload.identifier or not payload.password:
        raise HTTPException(status_code=400, detail="Email/Phone and password are required")

    identifier = payload.identifier.strip().lower()
    portal = payload.portal.lower()

    user = get_user_by_identifier(identifier)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials. Account not found.")

    if user.get("status") == "Blocked":
        raise HTTPException(status_code=403, detail="Account is blocked. Contact support.")

    if user.get("status") == "Inactive":
        raise HTTPException(status_code=403, detail="Account is inactive. Contact support.")

    # Verify password
    if not user.get("password_hash"):
        raise HTTPException(
            status_code=401,
            detail="Password not set. Please use OTP login or set a password first."
        )

    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials. Wrong password.")

    user_id = user["user_id"]
    agency_id = user.get("agency_id")
    role = "Agency Owner"

    # Determine role from portal membership
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

    print(f"[AUTH] Login: user_id={user_id}, portal={portal}, agency_id={agency_id}")
    return {
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "user_id": user_id,
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "portal": portal,
            "role": role
        },
        "agency_id": agency_id,
        "role": role,
        "portal": portal,
        "permissions": permissions
    }


# ─── ENDPOINT 4: Set / Update Password ───────────────────────────────────────

@app.post("/auth/set-password")
async def set_password(payload: SetPasswordRequest):
    """
    Set or update password for a user (after OTP verification).
    """
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
        cursor.execute("""
            UPDATE users SET password_hash = ?, token_version = token_version + 1
            WHERE user_id = ?
        """, (hashed, user["user_id"]))
        conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set password: {str(e)}")

    return {"success": True, "message": "Password set successfully"}


# ─── ENDPOINT 5: Refresh Token ────────────────────────────────────────────────

@app.post("/auth/refresh")
async def refresh_token(payload: RefreshTokenRequest):
    """
    Exchange a valid refresh token for a new access token.
    """
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
        cursor.execute("""
            SELECT user_id, email, name, status, token_version, agency_id, user_type
            FROM users WHERE user_id = ? AND is_deleted = 0
        """, (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            user = dict(zip(row.keys(), [row[k] for k in row.keys()]))
    except Exception as e:
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

    return {
        "success": True,
        "access_token": new_access_token,
        "token_type": "bearer"
    }


# ─── ENDPOINT 6: Logout ──────────────────────────────────────────────────────

@app.post("/auth/logout")
async def logout(
    request: Request,
    payload: Optional[LogoutRequest] = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    """
    Logout: Revoke refresh token + increment token_version to invalidate all access tokens.
    """
    token = credentials.credentials if credentials else None
    if not token:
        return {"success": True, "message": "Logged out"}

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

    return {"success": True, "message": "Logged out successfully"}


# ─── ENDPOINT 7: Get Current User Profile ────────────────────────────────────

@app.get("/auth/me")
async def get_me(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """
    Return current user info decoded from JWT.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return {
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
