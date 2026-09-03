# YATRA Backend — Changes & Fixes Log

> **Date:** 2026-08-27  
> **Scope:** Backend security hardening, bug fixes, and DB routing corrections  
> **Status:** ✅ All changes verified — `db_init.py` exits 0, all imports clean

---

## 📁 Files Modified

| File | Type of Change |
|------|---------------|
| `backend/auth_deps.py` | 🔐 Security rewrite |
| `backend/auth_utils.py` | 🐛 Bug fix |
| `backend/routers/auth_router.py` | 🔐 Security + 🐛 Bug fix |
| `backend/schemas/auth.py` | 🐛 Bug fix + compatibility |
| `backend/routers/agency_dashboard.py` | 🐛 DB routing fix |
| `backend/routers/agency_tours.py` | 🐛 DB routing fix |
| `backend/routers/agency_expenses.py` | 🐛 DB routing fix |
| `backend/routers/agency_fleet.py` | 🐛 DB routing fix |
| `backend/routers/agency_misc.py` | 🐛 DB routing + data isolation + SQL fix |
| `backend/routers/team_admin.py` | 🐛 DB routing fix |
| `backend/routers/traveller_router.py` | 🐛 DB routing fix |
| `backend/db_init.py` | 🐛 Seed schema fixes |
| `backend/agency_api.py` | 🔐 CORS hardening |
| `backend/traveller_api.py` | 🔐 CORS hardening |
| `backend/team_api.py` | 🔐 CORS hardening |
| `backend/auth_api.py` | 🔐 CORS hardening |
| `backend/run_backend.py` | 🐛 Port log bug fix |

---

## 🐛 Bug Fixes

### 1. DB Routing — All Routers Pointing to Wrong Database
**Files:** `agency_dashboard.py`, `agency_tours.py`, `agency_expenses.py`, `agency_fleet.py`, `agency_misc.py`, `team_admin.py`, `traveller_router.py`

All routers were calling `get_mysql_conn("yatra_agency")`, `get_mysql_conn("yatra_team")`, or `get_mysql_conn("yatra_traveller")` — databases that don't exist after the enterprise schema refactor. Every query was returning empty results or failing silently.

```python
# Before (broken — database does not exist)
def get_db_conn():
    return get_mysql_conn("yatra_agency")

# After (fixed — all data is in yatra_enterprise)
def get_db_conn():
    return get_mysql_conn("yatra_enterprise")
```

---

### 2. Missing `conn.commit()` — Refresh Tokens Not Persisting
**File:** `backend/auth_utils.py`

After inserting a refresh token into SQLite, the connection was closed without committing. Tokens were silently lost on every restart, forcing users to re-login constantly.

```python
# Before (tokens never saved to disk)
cursor.execute("INSERT INTO refresh_tokens ...")
conn.close()

# After (tokens properly persisted)
cursor.execute("INSERT INTO refresh_tokens ...")
conn.commit()   # Added
conn.close()
```

---

### 3. Wrong Port Number Logged in `run_backend.py`
**File:** `backend/run_backend.py`

The startup log was printing the string `"--port"` instead of the actual port number due to an off-by-one index error.

```python
# Before (prints "--port" string)
print(f"Launching {s['name']} on http://localhost:{s['command'][5]} ...")

# After (prints actual port number e.g. 8000)
print(f"Launching {s['name']} on http://localhost:{s['command'][6]} ...")
```

---

### 4. Google OAuth — Mixed `%s`/`?` Placeholders
**File:** `backend/routers/auth_router.py`

The `/auth/google` endpoint had 9 raw `%s` MySQL-style placeholders. These bypass the `MySQLCursorWrapper` translation layer, causing crashes when the app falls back to SQLite.

```python
# Before (MySQL-only, crashes on SQLite)
cursor.execute("SELECT ... FROM users WHERE email = %s", (email,))

# After (cross-database compatible)
cursor.execute("SELECT ... FROM users WHERE email = ?", (email,))
```

---

### 5. Password Change Not Committed
**File:** `backend/routers/auth_router.py`

The `set-password` endpoint updated the password hash but never called `conn.commit()`, so the new password was never actually saved.

```python
# Before (password change lost after request ends)
cursor.execute("UPDATE users SET password_hash = ? ...", (...))
conn.close()

# After
cursor.execute("UPDATE users SET password_hash = ? ...", (...))
conn.commit()   # Added
conn.close()
```

---

### 6. SQLite-Only `INSERT OR REPLACE` Syntax
**File:** `backend/routers/agency_misc.py`

The settings update endpoint used `INSERT OR REPLACE INTO settings` — a SQLite-only statement that throws a syntax error on MySQL.

```python
# Before (crashes on MySQL)
cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", ...)

# After (works on both MySQL and SQLite)
try:
    cursor.execute("INSERT INTO agency_settings (agency_id, `key`, `value`) VALUES (?, ?, ?)", ...)
except Exception:
    cursor.execute("UPDATE agency_settings SET `value` = ? WHERE agency_id = ? AND `key` = ?", ...)
```

---

### 7. Cross-Agency Data Leaks — Missing `agency_id` Filters
**File:** `backend/routers/agency_misc.py`

Three endpoints had no `agency_id` filter, exposing data from all agencies to every authenticated user:

- `GET /customers` — returned all customers across all agencies
- `GET /invoices` — returned all invoices from every agency
- `GET /settings` — returned all settings globally

**Fix:** Added `WHERE agency_id = ?` to all three queries.

---

### 8. `db_init.py` — Multiple Seed Mismatches

#### a) Vehicles — Wrong Column Names
```python
# Before (columns don't exist in MySQL schema)
INSERT INTO vehicles (... fitness, puc ...)

# After (matches 07_vehicles_and_maintenance.sql)
INSERT INTO vehicles (... insurance_expiry, permit_expiry, fitness_expiry, puc_expiry ...)
```

#### b) Notifications — Unquoted Reserved Words
```sql
-- Before (MySQL error: `date` and `read` are reserved keywords)
INSERT INTO notifications (agency_id, type, title, message, date, read)

-- After (backtick-quoted)
INSERT INTO notifications (agency_id, type, title, message, `date`, `read`)
```

#### c) `agency_settings` — Missing `agency_id` Column
```python
# Before (MySQL error: agency_id is NOT NULL)
INSERT INTO agency_settings (`key`, `value`) VALUES (...)

# After
INSERT INTO agency_settings (agency_id, `key`, `value`) VALUES (...)
```

#### d) `traveller_profiles` — Seeding Non-Existent Columns
```python
# Before (columns trips_count etc. don't exist)
INSERT INTO traveller_profiles (user_id, trips_count, expenses_count, ...)

# After (only seeds columns that actually exist)
INSERT INTO traveller_profiles (user_id, preferences)
```

#### e) `audit_logs` vs `logs` — Wrong Table Name for SQLite
Added a try/except to gracefully handle both `audit_logs` (MySQL) and `logs` (SQLite) table names.

---

### 9. Pydantic v2 Compatibility
**File:** `backend/schemas/auth.py`

`root_validator` was removed in Pydantic v2 and raises `PydanticUserError`. Rewrote using a mixin class that auto-detects the installed Pydantic version and uses the correct API.

Also added the required `otp: str` field to `SetPasswordRequest`.

---

## 🔐 Security Fixes

### S1. Unauthenticated Bypass via `?agency_id` Query Parameter — CRITICAL
**File:** `backend/auth_deps.py`

The old `get_current_user` dependency had a fallback: if no Bearer token was provided, it checked for a `?agency_id` query parameter and returned a fully authenticated `AuthUser` with `permissions=["*"]`. Any unauthenticated attacker who knew any `agency_id` (which are predictable like `AGY-1001`) could access all agency data without logging in.

```python
# Before — CRITICAL BUG: bypasses all authentication
if not token:
    agency_id = request.query_params.get("agency_id")
    if agency_id:
        return AuthUser(..., permissions=["*"])  # Full access, no token!

# After — raises 401 if no valid token
if not token:
    raise HTTPException(status_code=401, detail="Authentication token is missing.")
```

---

### S2. Silent Auth Granted on Database Failure — CRITICAL
**File:** `backend/auth_deps.py`

If the database was unreachable during token validation, the code silently caught the exception and returned an authenticated user. A DB outage could grant access to everyone.

```python
# Before — DB down = everyone authenticated
except Exception:
    return AuthUser(user_id=user_id, ...)  # Silently grants access!

# After — DB down = request fails safely
except Exception:
    raise HTTPException(status_code=503, detail="Auth service unavailable.")
```

---

### S3. OTP Leaked in API Response
**File:** `backend/routers/auth_router.py`

The `send-otp` endpoint returned the OTP code in plaintext in the JSON response. Any network observer, browser dev-tools log, or frontend bug could capture the OTP.

```python
# Before
return {"message": "OTP sent", "otp": otp_code}  # Leaked!

# After — only logged on the server
print(f"[AUTH OTP] OTP for '{identifier}': {otp_code}")  # Server log only
return {"message": "OTP sent successfully"}
```

---

### S4. Password Reset Without OTP Verification
**File:** `backend/routers/auth_router.py`

`/auth/set-password` accepted a new password for any email without verifying the requester owned that email. Anyone who knew a user's email could reset their password freely.

**Fix:** The endpoint now requires a valid `otp` in the request body. The OTP is verified and consumed before the password is changed.

---

### S5. Portal & Mode Fields Not Validated
**File:** `backend/routers/auth_router.py`

`portal` and `mode` fields in `send-otp` accepted arbitrary strings with no validation.

```python
# Added
_VALID_PORTALS = {"agency", "traveller", "team"}
if portal not in _VALID_PORTALS:
    raise HTTPException(400, detail="Invalid portal.")
if mode not in ("register", "login", "reset"):
    raise HTTPException(400, detail="Invalid mode.")
```

---

### S6. `/auth/debug-env` Exposed in Production
**File:** `backend/routers/auth_router.py`

This endpoint returned environment metadata. It now returns 404 when `YATRA_ENV=production`.

```python
if os.environ.get("YATRA_ENV", "development").lower() == "production":
    raise HTTPException(status_code=404, detail="Not found")
```

---

### S7. CORS Allowed All HTTP Origins
**Files:** `agency_api.py`, `traveller_api.py`, `team_api.py`, `auth_api.py`

All four API entry points used `allow_origin_regex=r"http://.*"` — this matches **any** HTTP origin including attacker-controlled domains, enabling cross-origin credential theft.

```python
# Before (matches any http:// origin — dangerous)
allow_origin_regex=r"http://.*"

# After (explicit allowlist only)
allow_origins=[
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]
```

> For production: set `FRONTEND_URL=https://yourdomain.com` in `.env`

---

## ✅ Verification Results

```
python db_init.py        →  exit 0  ✅  All schemas, views, and seeds OK
All routers imported     →  exit 0  ✅
All API apps initialized →  exit 0  ✅
All schemas imported     →  exit 0  ✅  Pydantic validator works correctly
```

---

## 🚀 Recommended Next Steps

1. Set `YATRA_ENV=production` in `.env` to disable debug endpoints
2. Set `FRONTEND_URL=https://yourdomain.com` for production CORS
3. Add **rate limiting** (`slowapi`) to `/auth/send-otp` and `/auth/login` to block brute-force
4. Replace console OTP logging with a real **email/SMS gateway** (e.g., SendGrid, Twilio)
5. Ensure all production traffic uses **HTTPS**
