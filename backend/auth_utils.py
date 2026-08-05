import os
import random
import datetime
import hashlib
import bcrypt
import jwt
from typing import Optional, Dict, Any, List
from core.database import get_db_conn as get_mysql_conn

# --- JWT Configuration ---
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "yatra_super_secret_jwt_access_key_2026_production")
REFRESH_SECRET_KEY = os.getenv("JWT_REFRESH_SECRET_KEY", "yatra_super_secret_jwt_refresh_key_2026_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 Hours
REFRESH_TOKEN_EXPIRE_DAYS = 7

# --- Password Hashing Utilities ---
def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    if not plain_password or not hashed_password:
        return False
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False

# --- JWT Token Utilities ---
def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generate JWT Access Token with user_id, agency_id, role, portal, email, token_version."""
    to_encode = data.copy()
    now = datetime.datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "iat": now,
        "exp": expire,
        "type": "access"
    })
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(user_id: str, token_version: int = 1) -> str:
    """Generate JWT Refresh Token with user_id and token_version."""
    now = datetime.datetime.utcnow()
    expire = now + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "user_id": user_id,
        "token_version": token_version,
        "iat": now,
        "exp": expire,
        "type": "refresh"
    }
    refresh_jwt = jwt.encode(payload, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    
    # Store refresh token SHA-256 hash in DB (SHA-256 avoids bcrypt 72-byte limit on long JWTs)
    token_hash = hashlib.sha256(refresh_jwt.encode('utf-8')).hexdigest()
    try:
        conn = get_mysql_conn("yatra_enterprise")
        cursor = conn.cursor()
        expires_at_str = expire.strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute("""
            INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked)
            VALUES (?, ?, ?, 0)
        """, (user_id, token_hash, expires_at_str))
        conn.close()
    except Exception as e:
        print(f"[AUTH] Error saving refresh token: {e}")
        
    return refresh_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate Access Token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except jwt.PyJWTError:
        return None

def decode_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate Refresh Token."""
    try:
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except jwt.PyJWTError:
        return None

# --- OTP Persistence & 5-Minute Expiration Utilities ---
def generate_and_save_otp(identifier: str, portal: str, mode: str) -> str:
    """Generate 6-digit numeric OTP and save to DB with 5-minute expiration."""
    otp_code = f"{random.randint(100000, 999999)}"
    now = datetime.datetime.now()
    expires_at = now + datetime.timedelta(minutes=5)
    
    clean_id = identifier.strip().lower()
    expires_str = expires_at.strftime('%Y-%m-%d %H:%M:%S')
    
    try:
        conn = get_mysql_conn("yatra_enterprise")
        cursor = conn.cursor()
        
        # Invalidate previous unused OTPs for this identifier
        cursor.execute("UPDATE otps SET is_used = 1 WHERE LOWER(identifier) = ? AND is_used = 0", (clean_id,))
        
        # Insert new OTP
        cursor.execute("""
            INSERT INTO otps (identifier, otp_code, portal, mode, expires_at, is_used)
            VALUES (?, ?, ?, ?, ?, 0)
        """, (clean_id, otp_code, portal, mode, expires_str))
        
        conn.close()
    except Exception as e:
        print(f"[AUTH_UTILS] Error saving OTP to DB: {e}")
        
    return otp_code

def verify_and_consume_otp(identifier: str, otp_code: str) -> bool:
    """Verify OTP code from DB. Invalidate upon successful verification."""
    clean_id = identifier.strip().lower()
    clean_code = otp_code.strip()
    now_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    try:
        conn = get_mysql_conn("yatra_enterprise")
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id FROM otps 
            WHERE LOWER(identifier) = ? AND otp_code = ? AND is_used = 0 AND expires_at >= ?
            ORDER BY id DESC LIMIT 1
        """, (clean_id, clean_code, now_str))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return False
            
        otp_id = row["id"] if isinstance(row, dict) else row[0]
        # Invalidate after successful verification
        cursor.execute("UPDATE otps SET is_used = 1 WHERE id = ?", (otp_id,))
        conn.close()
        return True
    except Exception as e:
        print(f"[AUTH_UTILS] Error verifying OTP in DB: {e}")
        return False
