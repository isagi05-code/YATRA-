from mysql_helper import get_db_conn as get_mysql_conn
from sms_helper import normalize_phone, send_actual_sms
from email_helper import send_otp_email
import json
import os
import random
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Yatra Traveller Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_conn():
    return get_mysql_conn("yatra_traveller")

# --- AUTHENTICATION & OTP SCHEMAS ---
class SendOtpPayload(BaseModel):
    email: str  # Can be email or user_id
    phone: Optional[str] = None
    mode: str  # "login" or "register"
    name: Optional[str] = None

class VerifyOtpPayload(BaseModel):
    email: str  # Can be email or user_id
    otp: str
    mode: str  # "login" or "register"
    phone: Optional[str] = None
    name: Optional[str] = None

# In-memory OTP store: mapping email/user_id -> otp_code
otp_store: Dict[str, str] = {}

@app.post("/auth/send-otp")
def send_otp(payload: SendOtpPayload):
    if not payload.email:
        raise HTTPException(status_code=400, detail="Email or User ID is required")
        
    identifier = payload.email.strip()
    target_email = identifier.lower()
    
    # Verify existence/duplicates
    if payload.mode == "login":
        try:
            trav_conn = get_db_conn()
            trav_cursor = trav_conn.cursor()
            trav_cursor.execute("SELECT * FROM profile WHERE LOWER(email) = ? OR LOWER(user_id) = ?", (target_email, target_email))
            prof_row = trav_cursor.fetchone()
            trav_conn.close()
            if not prof_row:
                raise HTTPException(status_code=400, detail="User ID or Email address not registered. Please register first.")
            target_email = prof_row["email"]
        except HTTPException as he:
            raise he
        except Exception as e:
            print(f"[AUTH] Error verifying login email: {e}")
    elif payload.mode == "register":
        try:
            trav_conn = get_db_conn()
            trav_cursor = trav_conn.cursor()
            trav_cursor.execute("SELECT * FROM profile WHERE LOWER(email) = ?", (target_email,))
            prof_row = trav_cursor.fetchone()
            trav_conn.close()
            if prof_row:
                raise HTTPException(status_code=400, detail="Email address already registered. Please log in.")
        except HTTPException as he:
            raise he
        except Exception as e:
            print(f"[AUTH] Error checking register email: {e}")

    # Generate 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"
    otp_store[identifier.lower()] = otp_code
    if target_email.lower() != identifier.lower():
        otp_store[target_email.lower()] = otp_code
    
    # Send actual email
    send_otp_email(target_email, otp_code)
    
    return {"message": "OTP sent successfully", "otp": otp_code}

@app.post("/auth/verify-otp")
def verify_otp(payload: VerifyOtpPayload):
    if not payload.email or not payload.otp:
        raise HTTPException(status_code=400, detail="Email/User ID and OTP are required")
        
    identifier = payload.email.strip().lower()
    stored_otp = otp_store.get(identifier)
    if not stored_otp or stored_otp != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    # Clear OTP after successful verification
    if identifier in otp_store:
        del otp_store[identifier]
        
    user_name = payload.name or "Traveller User"
    phone = normalize_phone(payload.phone) if payload.phone else ""
    user_id = None
    actual_email = identifier
    
    # If mode is register, insert/check in traveller database (profile table) and team database
    if payload.mode == "register":
        try:
            trav_conn = get_db_conn()
            trav_cursor = trav_conn.cursor()
            # Check if there is a profile with this email
            trav_cursor.execute("SELECT * FROM profile WHERE LOWER(email) = ?", (identifier,))
            prof_row = trav_cursor.fetchone()
            if not prof_row:
                trav_cursor.execute("SELECT user_id FROM profile WHERE user_id LIKE 'TRV-%'")
                rows = trav_cursor.fetchall()
                max_num = 1000
                for r in rows:
                    uid_str = r.get("user_id", "") if isinstance(r, dict) else r[0]
                    if uid_str and uid_str.startswith("TRV-"):
                        try:
                            num = int(uid_str.split("-")[1])
                            if num > max_num:
                                max_num = num
                        except ValueError:
                            pass
                user_id = f"TRV-{max_num + 1}"
                
                # Insert profile
                trav_cursor.execute("""
                INSERT INTO profile (user_id, name, email, contact, preferences)
                VALUES (?, ?, ?, ?, ?)
                """, (user_id, user_name, identifier, phone, "Vegetarian, Window seat"))
                print(f"[AUTH] Registered new traveller profile: {user_id} - {user_name} ({identifier}, {phone})")
            else:
                user_id = prof_row.get("user_id") or "TRV-1001"
                user_name = prof_row["name"]
                phone = prof_row["contact"]
            trav_conn.close()
            
            # Also insert in team database
            team_conn = get_mysql_conn("yatra_team")
            team_cursor = team_conn.cursor()
            team_cursor.execute("SELECT * FROM travellers WHERE LOWER(email) = ?", (identifier,))
            team_trav = team_cursor.fetchone()
            if not team_trav:
                team_cursor.execute("""
                INSERT INTO travellers (user_id, name, email, trips_count, expenses_count, bookings_count, feedback_rating, ai_usage_tokens)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (user_id, user_name, identifier, 0, 0, 0, 5.0, 0))
                print(f"[AUTH] Registered new traveller in team DB: {user_id} - {user_name} ({identifier})")
            team_conn.close()
        except Exception as e:
            print(f"[AUTH] Error writing traveller register info: {e}")
    else:
        # If login, lookup traveller details by email or user_id
        try:
            trav_conn = get_db_conn()
            trav_cursor = trav_conn.cursor()
            trav_cursor.execute("SELECT * FROM profile WHERE LOWER(email) = ? OR LOWER(user_id) = ?", (identifier, identifier))
            prof_row = trav_cursor.fetchone()
            if prof_row:
                user_id = prof_row.get("user_id") or "TRV-1001"
                user_name = prof_row["name"]
                phone = prof_row["contact"]
                actual_email = prof_row["email"]
            trav_conn.close()
        except Exception as e:
            print(f"[AUTH] Error reading traveller login info: {e}")
            
    if not user_id:
        user_id = "TRV-1001"
        
    return {
        "status": "success",
        "user": {
            "id": user_id,
            "user_id": user_id,
            "email": actual_email,
            "phone": phone,
            "role": "user",
            "name": user_name
        }
    }


# Pydantic models
class ExpenseCreate(BaseModel):
    user_id: Optional[str] = None
    title: str
    amount: float
    date: str
    category: str
    status: str = "Paid"

class TripCreate(BaseModel):
    user_id: Optional[str] = None
    name: str
    route: str
    date: str
    duration: str
    budget: float
    status: str = "Booked"
    driver: Optional[str] = "None"
    vehicle: Optional[str] = "None"

class BookingCreate(BaseModel):
    user_id: Optional[str] = None
    trip_id: int
    name: str
    status: str
    details: str

class DocumentCreate(BaseModel):
    user_id: Optional[str] = None
    name: str
    type: str
    file_url: str
    upload_date: str

class ProfileUpdate(BaseModel):
    user_id: Optional[str] = None
    name: str
    email: str
    contact: str
    preferences: str

# Endpoints
@app.get("/dashboard/summary")
def get_dashboard_summary(user_id: Optional[str] = None):
    conn = get_db_conn()
    cursor = conn.cursor()
    
    if user_id:
        cursor.execute("SELECT COUNT(*) FROM trips WHERE user_id = ?", (user_id,))
        trips_count = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT SUM(amount) FROM expenses WHERE user_id = ?", (user_id,))
        total_spent = cursor.fetchone()[0] or 0.0
    else:
        cursor.execute("SELECT COUNT(*) FROM trips")
        trips_count = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT SUM(amount) FROM expenses")
        total_spent = cursor.fetchone()[0] or 0.0
        
    conn.close()
    
    # Budget tracker values
    monthly_budget = 25000.0
    savings = monthly_budget - total_spent if total_spent < monthly_budget else 0.0
    
    return {
        "trips_count": trips_count,
        "total_spent": total_spent,
        "monthly_budget": monthly_budget,
        "savings": savings,
        "tracker": {
            "daily_spent_avg": total_spent / 30.0 if total_spent else 0,
            "weekly_spent_avg": total_spent / 4.0 if total_spent else 0
        }
    }

# Trips CRUD
@app.get("/trips")
def get_trips(status: Optional[str] = None, user_id: Optional[str] = None):
    conn = get_db_conn()
    cursor = conn.cursor()
    query = "SELECT * FROM trips WHERE 1=1"
    params = []
    if status:
        query += " AND status = ?"
        params.append(status)
    if user_id:
        query += " AND user_id = ?"
        params.append(user_id)
    cursor.execute(query, params)
    trips = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return trips

@app.post("/trips")
def create_trip(trip: TripCreate):
    conn = get_db_conn()
    cursor = conn.cursor()
    uid = trip.user_id or "TRV-1001"
    cursor.execute("""
    INSERT INTO trips (user_id, name, route, date, duration, budget, status, driver, vehicle)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
    (uid, trip.name, trip.route, trip.date, trip.duration, trip.budget, trip.status, trip.driver, trip.vehicle))
    trip_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"message": "Trip created successfully", "trip_id": trip_id}

@app.get("/trips/{trip_id}")
def get_trip_details(trip_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM trips WHERE id = ?", (trip_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Trip not found")
    return dict(row)

# Traveller Expenses CRUD (Independent Tracker)
@app.get("/expenses")
def get_expenses(category: Optional[str] = None, user_id: Optional[str] = None):
    conn = get_db_conn()
    cursor = conn.cursor()
    query = "SELECT * FROM expenses WHERE 1=1"
    params = []
    if category:
        query += " AND category = ?"
        params.append(category)
    if user_id:
        query += " AND user_id = ?"
        params.append(user_id)
    cursor.execute(query, params)
    expenses = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return expenses

@app.post("/expenses")
def create_expense(exp: ExpenseCreate):
    conn = get_db_conn()
    cursor = conn.cursor()
    uid = exp.user_id or "TRV-1001"
    cursor.execute("""
    INSERT INTO expenses (user_id, title, amount, date, category, status)
    VALUES (?, ?, ?, ?, ?, ?)""",
    (uid, exp.title, exp.amount, exp.date, exp.category, exp.status))
    exp_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"message": "Expense added successfully", "expense_id": exp_id}

@app.delete("/expenses/{exp_id}")
def delete_expense(exp_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM expenses WHERE id = ?", (exp_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Expense not found")
    conn.commit()
    conn.close()
    return {"message": "Expense deleted successfully"}

# Expenses Analytics
@app.get("/expenses/analytics")
def get_expenses_analytics(user_id: Optional[str] = None):
    conn = get_db_conn()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT category, SUM(amount) FROM expenses WHERE user_id = ? GROUP BY category", (user_id,))
    else:
        cursor.execute("SELECT category, SUM(amount) FROM expenses GROUP BY category")
    category_summary = {row[0]: row[1] for row in cursor.fetchall()}
    conn.close()
    
    return {
        "budget_limit": 25000.0,
        "category_wise_spending": category_summary,
        "daily_spending": {
            "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            "data": [450, 1200, 300, 850, 1800, 2500, 600]
        },
        "weekly_spending": {
            "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
            "data": [3500, 4800, 2100, 5600]
        },
        "monthly_spending_trend": {
            "labels": ["Apr", "May", "Jun", "Jul"],
            "data": [12000, 15000, 9500, 16000]
        }
    }

# Bookings Endpoints
@app.get("/bookings")
def get_bookings(user_id: Optional[str] = None):
    conn = get_db_conn()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT * FROM bookings WHERE user_id = ?", (user_id,))
    else:
        cursor.execute("SELECT * FROM bookings")
    bookings = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return bookings

@app.post("/bookings")
def create_booking(bk: BookingCreate):
    conn = get_db_conn()
    cursor = conn.cursor()
    uid = bk.user_id or "TRV-1001"
    cursor.execute("INSERT INTO bookings (user_id, trip_id, name, status, details) VALUES (?, ?, ?, ?, ?)",
    (uid, bk.trip_id, bk.name, bk.status, bk.details))
    conn.commit()
    conn.close()
    return {"message": "Booking added successfully"}

# Documents Endpoints
@app.get("/documents")
def get_documents(user_id: Optional[str] = None):
    conn = get_db_conn()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT * FROM documents WHERE user_id = ?", (user_id,))
    else:
        cursor.execute("SELECT * FROM documents")
    docs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return docs

@app.post("/documents")
def upload_document(doc: DocumentCreate):
    conn = get_db_conn()
    cursor = conn.cursor()
    uid = doc.user_id or "TRV-1001"
    cursor.execute("INSERT INTO documents (user_id, name, type, file_url, upload_date) VALUES (?, ?, ?, ?, ?)",
    (uid, doc.name, doc.type, doc.file_url, doc.upload_date))
    conn.commit()
    conn.close()
    return {"message": "Document uploaded successfully"}

# Profile & Settings Endpoints
@app.get("/profile")
def get_profile(user_id: Optional[str] = None):
    conn = get_db_conn()
    cursor = conn.cursor()
    if user_id:
        cursor.execute("SELECT * FROM profile WHERE LOWER(user_id) = ? OR LOWER(email) = ?", (user_id.lower(), user_id.lower()))
    else:
        cursor.execute("SELECT * FROM profile LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {}
    return dict(row)

@app.put("/profile")
def update_profile(prof: ProfileUpdate):
    conn = get_db_conn()
    cursor = conn.cursor()
    uid = prof.user_id or "TRV-1001"
    cursor.execute("UPDATE profile SET name = ?, email = ?, contact = ?, preferences = ? WHERE LOWER(user_id) = ? OR LOWER(email) = ?",
    (prof.name, prof.email, prof.contact, prof.preferences, uid.lower(), prof.email.lower()))
    conn.commit()
    conn.close()
    return {"message": "Profile updated successfully"}

@app.get("/settings")
def get_settings():
    return {
        "notifications_enabled": True,
        "theme": "dark",
        "currency_preference": "INR",
        "auto_sync_bookings": True
    }

