from core.database import get_db_conn as get_mysql_conn
from services.notifications import normalize_phone, send_actual_sms, send_otp_email
import json
import os
import random
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Yatra Agency Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_conn():
    return get_mysql_conn("yatra_agency")

def require_agency_id(agency_id: Optional[str]) -> str:
    if not agency_id:
        return "AGY-1001"
    return agency_id

def verify_tour_belongs_to_agency(cursor, trip_id: int, agency_id: str):
    cursor.execute("SELECT agency_id FROM tours WHERE trip_id = ?", (trip_id,))
    row = cursor.fetchone()
    if not row or row["agency_id"] != agency_id:
        raise HTTPException(status_code=404, detail="Tour not found for this agency")
    return row

def month_labels_from_rows(rows, value_key="total"):
    labels = [r["month_label"] for r in rows]
    data = [round(float(r[value_key] or 0) / 100000, 2) for r in rows]
    return labels, data

# --- AUTHENTICATION & OTP SCHEMAS ---
class SendOtpPayload(BaseModel):
    email: str
    phone: Optional[str] = None
    mode: str  # "login" or "register"
    name: Optional[str] = None

class VerifyOtpPayload(BaseModel):
    email: str
    otp: str
    mode: str  # "login" or "register"
    phone: Optional[str] = None
    name: Optional[str] = None

# In-memory OTP store: mapping email -> otp_code
otp_store: Dict[str, str] = {}

@app.post("/auth/send-otp")
def send_otp(payload: SendOtpPayload):
    if not payload.email:
        raise HTTPException(status_code=400, detail="Email or Agency ID is required")
        
    identifier = payload.email.strip()
    target_email = identifier.lower()
    
    # Verify existence/duplicates
    if payload.mode == "login":
        try:
            team_conn = get_mysql_conn("yatra_team")
            team_cursor = team_conn.cursor()
            team_cursor.execute("SELECT * FROM agencies WHERE LOWER(email) = ? OR LOWER(agency_id) = ?", (target_email, target_email))
            agency_row = team_cursor.fetchone()
            team_conn.close()
            if not agency_row:
                raise HTTPException(status_code=400, detail="Agency ID or Email address not registered. Please register first.")
            target_email = agency_row["email"]
        except HTTPException as he:
            raise he
        except Exception as e:
            print(f"[AUTH] Error verifying login email: {e}")
    elif payload.mode == "register":
        try:
            team_conn = get_mysql_conn("yatra_team")
            team_cursor = team_conn.cursor()
            team_cursor.execute("SELECT * FROM agencies WHERE LOWER(email) = ?", (target_email,))
            agency_row = team_cursor.fetchone()
            team_conn.close()
            if agency_row:
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
        raise HTTPException(status_code=400, detail="Email/Agency ID and OTP are required")
        
    identifier = payload.email.strip().lower()
    stored_otp = otp_store.get(identifier)
    if not stored_otp or stored_otp != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    # Clear OTP after successful verification
    if identifier in otp_store:
        del otp_store[identifier]
        
    user_name = payload.name or "Agency User"
    phone = normalize_phone(payload.phone) if payload.phone else ""
    agency_id = None
    actual_email = identifier
    
    # If mode is register, insert/check in team database (admin platform)
    if payload.mode == "register":
        try:
            team_conn = get_mysql_conn("yatra_team")
            team_cursor = team_conn.cursor()
            # Check if agency with this email exists
            team_cursor.execute("SELECT * FROM agencies WHERE LOWER(email) = ?", (identifier,))
            agency_row = team_cursor.fetchone()
            if not agency_row:
                team_cursor.execute("SELECT agency_id FROM agencies WHERE agency_id LIKE 'AGY-%'")
                rows = team_cursor.fetchall()
                max_num = 1000
                for r in rows:
                    aid_str = r.get("agency_id", "") if isinstance(r, dict) else r[0]
                    if aid_str and aid_str.startswith("AGY-"):
                        try:
                            num = int(aid_str.split("-")[1])
                            if num > max_num:
                                max_num = num
                        except ValueError:
                            pass
                agency_id = f"AGY-{max_num + 1}"
                
                team_cursor.execute("""
                INSERT INTO agencies (agency_id, name, owner, contact, email, status, active_tours, revenue, expenses, drivers_count, vehicles_count, subscription_status, documents)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (agency_id, user_name, user_name, phone, identifier, "Active", 0, 0.0, 0.0, 0, 0, "Trial (Expires: 2026-08-15)", "[]"))
                print(f"[AUTH] Registered new agency: {agency_id} - {user_name} ({identifier}, {phone})")
            else:
                agency_id = agency_row.get("agency_id") or "AGY-1001"
                user_name = agency_row["owner"]
                phone = agency_row["contact"]
            team_conn.close()
        except Exception as e:
            print(f"[AUTH] Error writing register info to team DB: {e}")
    else:
        # If mode is login, try to lookup agency owner name, phone & agency_id from team DB by email or agency_id
        try:
            team_conn = get_mysql_conn("yatra_team")
            team_cursor = team_conn.cursor()
            team_cursor.execute("SELECT * FROM agencies WHERE LOWER(email) = ? OR LOWER(agency_id) = ?", (identifier, identifier))
            agency_row = team_cursor.fetchone()
            if agency_row:
                agency_id = agency_row.get("agency_id") or "AGY-1001"
                user_name = agency_row["owner"]
                phone = agency_row["contact"]
                actual_email = agency_row["email"]
            team_conn.close()
        except Exception as e:
            print(f"[AUTH] Error reading login info from team DB: {e}")
            
    if not agency_id:
        agency_id = "AGY-1001"

    return {
        "status": "success",
        "user": {
            "id": agency_id,
            "agency_id": agency_id,
            "email": actual_email,
            "phone": phone,
            "role": "agency",
            "name": user_name
        }
    }


# Pydantic Schemas
class TourCreate(BaseModel):
    destination: str
    customer: str
    agency: str
    start_date: str
    end_date: str
    status: str = "Upcoming"
    vehicle: Optional[str] = None
    driver: Optional[str] = None
    passengers: int = 1
    guide: Optional[str] = "None"
    budget: float = 0.0
    current_lat: float = 19.0760
    current_lng: float = 72.8777
    timeline_status: str = "Booking Created"

class ExpenseCreate(BaseModel):
    trip_id: Optional[int] = None
    amount: float
    gst: float
    vendor: str
    category: str
    date: str
    time: str
    description: str
    payment_mode: str
    approved_by: str = "Pending"
    status: str = "Pending"
    receipt_image: Optional[str] = None
    ocr_extracted_data: Optional[str] = None

class VehicleCreate(BaseModel):
    vehicle_number: str
    model: str
    owner: str
    insurance: str
    permit: str
    fitness: str
    puc: str
    fuel_type: str
    mileage: float
    current_location: str
    availability: str = "Available"
    service_history: Optional[str] = "[]"
    expenses: float = 0.0
    upcoming_maintenance: str

class DriverCreate(BaseModel):
    name: str
    license: str
    aadhar: str
    experience: int
    trips_completed: int = 0
    assigned_tour: str = "None"
    current_location: str
    contact: str
    emergency_contact: str
    salary: float
    expense: float = 0.0
    ratings: float = 5.0
    documents: Optional[str] = "{}"

class CustomerCreate(BaseModel):
    name: str
    contact: str
    email: str
    booking_history: Optional[str] = "[]"
    invoices: Optional[str] = "[]"
    payments: Optional[str] = "[]"
    upcoming_tours: Optional[str] = "[]"
    documents: Optional[str] = "{}"

class NotificationCreate(BaseModel):
    type: str
    title: str
    message: str
    date: str

class SettingsUpdate(BaseModel):
    value: str

# 1. Summary Cards Endpoint
@app.get("/dashboard/summary")
def get_dashboard_summary(agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM tours WHERE agency_id = ? AND status = 'Active'", (agency_id,))
    active_tours = cursor.fetchone()[0] or 0

    cursor.execute("SELECT COUNT(*) FROM tours WHERE agency_id = ? AND status = 'Completed'", (agency_id,))
    completed_tours = cursor.fetchone()[0] or 0

    cursor.execute("SELECT COUNT(*) FROM vehicles WHERE agency_id = ?", (agency_id,))
    total_vehicles = cursor.fetchone()[0] or 0

    cursor.execute("SELECT COUNT(*) FROM drivers WHERE agency_id = ?", (agency_id,))
    total_drivers = cursor.fetchone()[0] or 0

    cursor.execute("SELECT COUNT(*) FROM tours WHERE agency_id = ? AND status = 'Upcoming'", (agency_id,))
    upcoming_tours = cursor.fetchone()[0] or 0

    cursor.execute("""
        SELECT COALESCE(SUM(budget), 0) FROM tours
        WHERE agency_id = ? AND status = 'Completed'
    """, (agency_id,))
    total_revenue = float(cursor.fetchone()[0] or 0)

    cursor.execute("""
        SELECT COALESCE(SUM(e.amount), 0) FROM expenses e
        INNER JOIN tours t ON e.trip_id = t.trip_id
        WHERE t.agency_id = ?
    """, (agency_id,))
    total_expenses = float(cursor.fetchone()[0] or 0)

    cursor.execute("""
        SELECT COALESCE(SUM(e.amount), 0) FROM expenses e
        INNER JOIN tours t ON e.trip_id = t.trip_id
        WHERE t.agency_id = ? AND e.status = 'Approved'
    """, (agency_id,))
    approved_expenses = float(cursor.fetchone()[0] or 0)

    profit = total_revenue - total_expenses

    cursor.execute("""
        SELECT COALESCE(SUM(t.budget), 0) FROM tours t
        WHERE t.agency_id = ? AND t.status = 'Completed'
        AND (t.timeline_status IS NULL OR t.timeline_status != 'Payment Completed')
    """, (agency_id,))
    pending_payments = float(cursor.fetchone()[0] or 0)

    cursor.execute("""
        SELECT COALESCE(SUM(e.amount), 0) FROM expenses e
        INNER JOIN tours t ON e.trip_id = t.trip_id
        WHERE t.agency_id = ? AND e.date = CURDATE()
    """, (agency_id,))
    todays_expense = float(cursor.fetchone()[0] or 0)

    cursor.execute("""
        SELECT COALESCE(SUM(e.amount), 0) FROM expenses e
        INNER JOIN tours t ON e.trip_id = t.trip_id
        WHERE t.agency_id = ? AND YEAR(e.date) = YEAR(CURDATE()) AND MONTH(e.date) = MONTH(CURDATE())
    """, (agency_id,))
    monthly_expense = float(cursor.fetchone()[0] or 0)

    cursor.execute("""
        SELECT COALESCE(SUM(e.amount), 0) FROM expenses e
        INNER JOIN tours t ON e.trip_id = t.trip_id
        WHERE t.agency_id = ? AND YEAR(e.date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        AND MONTH(e.date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
    """, (agency_id,))
    last_month_expense = float(cursor.fetchone()[0] or 0)

    if last_month_expense > 0:
        pct_change = ((monthly_expense - last_month_expense) / last_month_expense) * 100
        expense_trend = f"{'↑' if pct_change >= 0 else '↓'} {abs(pct_change):.0f}% this month"
    elif monthly_expense > 0:
        expense_trend = "↑ 100% this month"
    else:
        expense_trend = "No expenses yet"

    cursor.execute("SELECT * FROM notifications WHERE agency_id = ? ORDER BY id DESC LIMIT 5", (agency_id,))
    notifications = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {
        "stats": {
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "profit": profit,
            "active_tours": active_tours,
            "completed_tours": completed_tours,
            "total_vehicles": total_vehicles,
            "total_drivers": total_drivers,
            "pending_payments": pending_payments,
            "upcoming_tours": upcoming_tours,
            "todays_expense": todays_expense,
            "monthly_expense": monthly_expense,
            "expense_trend": expense_trend,
            "approved_expenses": approved_expenses,
        },
        "recent_notifications": notifications
    }

# 2. Charts Endpoint
@app.get("/dashboard/graphs")
def get_dashboard_graphs(agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT DATE_FORMAT(e.date, '%b') AS month_label, COALESCE(SUM(e.amount), 0) AS total
        FROM expenses e
        INNER JOIN tours t ON e.trip_id = t.trip_id
        WHERE t.agency_id = ? AND e.date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY YEAR(e.date), MONTH(e.date), DATE_FORMAT(e.date, '%b')
        ORDER BY YEAR(e.date), MONTH(e.date)
    """, (agency_id,))
    monthly_rows = [dict(r) for r in cursor.fetchall()]
    me_labels, me_data = month_labels_from_rows(monthly_rows)

    cursor.execute("""
        SELECT DATE_FORMAT(t.end_date, '%b') AS month_label,
               COALESCE(SUM(t.budget), 0) AS revenue,
               COALESCE(SUM(e.amount), 0) AS expense
        FROM tours t
        LEFT JOIN expenses e ON e.trip_id = t.trip_id
        WHERE t.agency_id = ? AND t.end_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY YEAR(t.end_date), MONTH(t.end_date), DATE_FORMAT(t.end_date, '%b')
        ORDER BY YEAR(t.end_date), MONTH(t.end_date)
    """, (agency_id,))
    rev_rows = [dict(r) for r in cursor.fetchall()]
    rve_labels = [r["month_label"] for r in rev_rows]
    rve_revenue = [round(float(r["revenue"] or 0) / 100000, 2) for r in rev_rows]
    rve_expense = [round(float(r["expense"] or 0) / 100000, 2) for r in rev_rows]

    cursor.execute("""
        SELECT v.vehicle_number,
               COUNT(CASE WHEN t.status IN ('Active', 'Completed') THEN 1 END) AS days_active
        FROM vehicles v
        LEFT JOIN tours t ON t.vehicle = v.vehicle_number AND t.agency_id = v.agency_id
        WHERE v.agency_id = ?
        GROUP BY v.vehicle_number
    """, (agency_id,))
    veh_rows = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
        SELECT name, ratings FROM drivers WHERE agency_id = ? ORDER BY ratings DESC LIMIT 5
    """, (agency_id,))
    drv_rows = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
        SELECT e.category, COALESCE(SUM(e.amount), 0) AS total
        FROM expenses e
        INNER JOIN tours t ON e.trip_id = t.trip_id
        WHERE t.agency_id = ?
        GROUP BY e.category
        ORDER BY total DESC
    """, (agency_id,))
    cat_rows = [dict(r) for r in cursor.fetchall()]
    cat_total = sum(float(r["total"] or 0) for r in cat_rows) or 1
    cat_labels = [r["category"] for r in cat_rows]
    cat_pcts = [round(float(r["total"] or 0) / cat_total * 100, 1) for r in cat_rows]

    cursor.execute("SELECT COUNT(*) FROM tours WHERE agency_id = ? AND status = 'Completed'", (agency_id,))
    tours_completed = cursor.fetchone()[0] or 0
    cursor.execute("SELECT COUNT(*) FROM tours WHERE agency_id = ? AND status = 'Upcoming'", (agency_id,))
    tours_upcoming = cursor.fetchone()[0] or 0
    cursor.execute("SELECT COUNT(*) FROM tours WHERE agency_id = ? AND status = 'Active'", (agency_id,))
    tours_active = cursor.fetchone()[0] or 0

    cursor.execute("""
        SELECT CONCAT('Q', QUARTER(t.end_date)) AS quarter_label,
               COALESCE(SUM(t.budget), 0) - COALESCE(SUM(e.amount), 0) AS profit
        FROM tours t
        LEFT JOIN expenses e ON e.trip_id = t.trip_id
        WHERE t.agency_id = ? AND t.status = 'Completed' AND YEAR(t.end_date) = YEAR(CURDATE())
        GROUP BY QUARTER(t.end_date), CONCAT('Q', QUARTER(t.end_date))
        ORDER BY QUARTER(t.end_date)
    """, (agency_id,))
    profit_rows = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
        SELECT COALESCE(SUM(e.amount), 0) AS total
        FROM expenses e
        INNER JOIN tours t ON e.trip_id = t.trip_id
        WHERE t.agency_id = ? AND e.category = 'Fuel'
        AND e.date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)
    """, (agency_id,))
    fuel_total = float(cursor.fetchone()[0] or 0)
    fuel_weekly = [round(fuel_total / 4 / 1000, 1)] * 4 if fuel_total else [0, 0, 0, 0]

    conn.close()

    return {
        "monthly_expense": {"labels": me_labels or [], "data": me_data or []},
        "revenue_vs_expense": {
            "labels": rve_labels or [],
            "revenue": rve_revenue or [],
            "expense": rve_expense or []
        },
        "vehicle_usage": {
            "labels": [r["vehicle_number"] for r in veh_rows],
            "days_active": [int(r["days_active"] or 0) for r in veh_rows]
        },
        "driver_performance": {
            "labels": [r["name"] for r in drv_rows],
            "ratings": [float(r["ratings"] or 0) for r in drv_rows]
        },
        "fuel_consumption": {
            "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
            "liters": fuel_weekly
        },
        "category_wise_expense": {
            "labels": cat_labels or [],
            "percentages": cat_pcts or []
        },
        "tours_status": {
            "completed": tours_completed,
            "upcoming": tours_upcoming,
            "active": tours_active
        },
        "profit_trend": {
            "labels": [r["quarter_label"] for r in profit_rows],
            "profit": [round(float(r["profit"] or 0) / 100000, 2) for r in profit_rows]
        }
    }

# 3. Tours Endpoints
@app.get("/tours")
def get_tours(status: Optional[str] = None, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    query = "SELECT * FROM tours WHERE agency_id = ?"
    params = [agency_id]
    if status:
        query += " AND status = ?"
        params.append(status)
    cursor.execute(query, params)
    tours = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return tours

@app.post("/tours")
def create_tour(tour: TourCreate, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO tours (agency_id, destination, customer, agency, start_date, end_date, status, vehicle, driver, passengers, guide, budget, current_lat, current_lng, timeline_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
    (agency_id, tour.destination, tour.customer, tour.agency, tour.start_date, tour.end_date, tour.status, tour.vehicle, tour.driver, tour.passengers, tour.guide, tour.budget, tour.current_lat, tour.current_lng, tour.timeline_status))
    trip_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"message": "Tour created", "trip_id": trip_id}

@app.get("/tours/{trip_id}")
def get_tour_details(trip_id: int, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tours WHERE trip_id = ? AND agency_id = ?", (trip_id, agency_id))
    tour_row = cursor.fetchone()
    if not tour_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Tour not found")
        
    tour = dict(tour_row)
    
    # Stops
    cursor.execute("SELECT * FROM tour_stops WHERE trip_id = ?", (trip_id,))
    tour["stops"] = [dict(row) for row in cursor.fetchall()]
    
    # Timeline
    cursor.execute("SELECT * FROM tour_timeline WHERE trip_id = ?", (trip_id,))
    tour["timeline"] = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return tour

@app.put("/tours/{trip_id}")
def update_tour(trip_id: int, status: str, timeline_status: Optional[str] = None, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    verify_tour_belongs_to_agency(cursor, trip_id, agency_id)
    if timeline_status:
        cursor.execute("UPDATE tours SET status = ?, timeline_status = ? WHERE trip_id = ? AND agency_id = ?", (status, timeline_status, trip_id, agency_id))
    else:
        cursor.execute("UPDATE tours SET status = ? WHERE trip_id = ? AND agency_id = ?", (status, trip_id, agency_id))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Tour not found")
    conn.commit()
    conn.close()
    return {"message": "Tour updated successfully"}

@app.delete("/tours/{trip_id}")
def delete_tour(trip_id: int, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tours WHERE trip_id = ? AND agency_id = ?", (trip_id, agency_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Tour not found")
    conn.commit()
    conn.close()
    return {"message": "Tour deleted successfully"}

# Journey Tracking Endpoints
@app.get("/tours/{trip_id}/journey")
def get_journey_tracking(trip_id: int, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT current_lat, current_lng, destination, vehicle, driver FROM tours WHERE trip_id = ? AND agency_id = ?", (trip_id, agency_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Tour not found")
    
    cursor.execute("SELECT * FROM tour_stops WHERE trip_id = ?", (trip_id,))
    stops = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    return {
        "current_location": {"lat": row["current_lat"], "lng": row["current_lng"]},
        "vehicle": row["vehicle"],
        "driver": row["driver"],
        "stops": stops,
        "completed_route": [{"lat": 19.0760, "lng": 72.8777}, {"lat": 20.0, "lng": 73.5}, {"lat": row["current_lat"], "lng": row["current_lng"]}],
        "remaining_route": [{"lat": row["current_lat"], "lng": row["current_lng"]}, {"lat": 25.0, "lng": 74.5}, {"lat": 26.9124, "lng": 75.7873}]
    }

@app.put("/tours/{trip_id}/journey")
def update_journey_location(trip_id: int, lat: float, lng: float, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    verify_tour_belongs_to_agency(cursor, trip_id, agency_id)
    cursor.execute("UPDATE tours SET current_lat = ?, current_lng = ? WHERE trip_id = ? AND agency_id = ?", (lat, lng, trip_id, agency_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Tour not found")
    conn.commit()
    conn.close()
    return {"message": "Location updated successfully"}

# Day-wise Expense breakdown
@app.get("/tours/{trip_id}/day-wise-expenses")
def get_day_wise_expenses(trip_id: int, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    verify_tour_belongs_to_agency(cursor, trip_id, agency_id)
    cursor.execute("SELECT * FROM expenses WHERE trip_id = ?", (trip_id,))
    expenses_list = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    # Categorize by day/date
    day_wise = {}
    grand_total = 0.0
    for exp in expenses_list:
        date = exp["date"]
        category = exp["category"]
        amount = exp["amount"]
        grand_total += amount
        if date not in day_wise:
            day_wise[date] = {"Food": 0, "Fuel": 0, "Hotel": 0, "Stay": 0, "Toll": 0, "Maintenance": 0, "Driver": 0, "Misc": 0, "Total": 0}
        
        # Mapping
        cat_key = category
        if "Stay" in category or "Hotel" in category:
            cat_key = "Stay"
        elif "Food" in category:
            cat_key = "Food"
        elif "Fuel" in category:
            cat_key = "Fuel"
        elif "Toll" in category:
            cat_key = "Toll"
        elif "Maintenance" in category:
            cat_key = "Maintenance"
        elif "Driver" in category:
            cat_key = "Driver"
        else:
            cat_key = "Misc"
            
        day_wise[date][cat_key] = day_wise[date].get(cat_key, 0) + amount
        day_wise[date]["Total"] += amount
        
    return {
        "trip_id": trip_id,
        "day_wise_breakdown": day_wise,
        "grand_total": grand_total
    }

# Vehicle Assignment
@app.put("/tours/{trip_id}/vehicle-assignment")
def assign_vehicle_to_tour(trip_id: int, vehicle_number: str, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    verify_tour_belongs_to_agency(cursor, trip_id, agency_id)

    cursor.execute("SELECT availability, model FROM vehicles WHERE vehicle_number = ? AND agency_id = ?", (vehicle_number, agency_id))
    veh = cursor.fetchone()
    if not veh:
        conn.close()
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Assign vehicle
    cursor.execute("UPDATE tours SET vehicle = ? WHERE trip_id = ?", (vehicle_number, trip_id))
    cursor.execute("UPDATE vehicles SET availability = 'Assigned' WHERE vehicle_number = ?", (vehicle_number,))
    conn.commit()
    conn.close()
    return {"message": f"Vehicle {vehicle_number} ({veh['model']}) assigned to trip {trip_id} successfully."}

# Driver Assignment
@app.put("/tours/{trip_id}/driver-assignment")
def assign_driver_to_tour(trip_id: int, driver_id: int, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    verify_tour_belongs_to_agency(cursor, trip_id, agency_id)

    cursor.execute("SELECT name, assigned_tour FROM drivers WHERE driver_id = ? AND agency_id = ?", (driver_id, agency_id))
    driver_row = cursor.fetchone()
    if not driver_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Driver not found")
        
    driver_name = driver_row["name"]
    cursor.execute("UPDATE tours SET driver = ? WHERE trip_id = ?", (driver_name, trip_id))
    cursor.execute("UPDATE drivers SET assigned_tour = (SELECT destination FROM tours WHERE trip_id = ?) WHERE driver_id = ?", (trip_id, driver_id))
    conn.commit()
    conn.close()
    return {"message": f"Driver {driver_name} assigned to trip {trip_id} successfully."}

# Timeline status management
@app.get("/tours/{trip_id}/timeline")
def get_tour_timeline(trip_id: int, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    verify_tour_belongs_to_agency(cursor, trip_id, agency_id)
    cursor.execute("SELECT * FROM tour_timeline WHERE trip_id = ? ORDER BY id ASC", (trip_id,))
    timeline = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return timeline

@app.post("/tours/{trip_id}/timeline")
def add_timeline_event(trip_id: int, event_name: str, status: str = "Completed", updated_at: str = "2026-07-05 12:00:00", agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    verify_tour_belongs_to_agency(cursor, trip_id, agency_id)
    cursor.execute("INSERT INTO tour_timeline (trip_id, event_name, status, updated_at) VALUES (?, ?, ?, ?)", (trip_id, event_name, status, updated_at))
    conn.commit()
    conn.close()
    return {"message": "Timeline event added"}

# Tour Analytics
@app.get("/tours/{trip_id}/analytics")
def get_tour_analytics(trip_id: int, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT budget, destination FROM tours WHERE trip_id = ? AND agency_id = ?", (trip_id, agency_id))
    tour = cursor.fetchone()
    if not tour:
        conn.close()
        raise HTTPException(status_code=404, detail="Tour not found")
    
    cursor.execute("SELECT SUM(amount) FROM expenses WHERE trip_id = ? AND status = 'Approved'", (trip_id,))
    exp_sum = cursor.fetchone()[0] or 0.0
    
    conn.close()
    
    # Mock some data for metrics
    dist_covered = 320.0
    fuel_used = 32.5
    avg_mileage = 9.8
    profit = tour["budget"] - exp_sum
    
    return {
        "trip_id": trip_id,
        "destination": tour["destination"],
        "distance_covered_km": dist_covered,
        "fuel_used_liters": fuel_used,
        "average_mileage": avg_mileage,
        "total_budget": tour["budget"],
        "total_expenses": exp_sum,
        "profit": profit,
        "customer_rating": 4.8
    }

# 4. Expenses Endpoints
@app.get("/expenses")
def get_expenses(category: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()

    # Get expenses linked to this agency's tours OR standalone (no trip_id)
    query = """
        SELECT e.* FROM expenses e
        LEFT JOIN tours t ON e.trip_id = t.trip_id
        WHERE (t.agency_id = ? OR (e.trip_id IS NULL AND e.agency_id = ?))
    """
    params = [agency_id, agency_id]

    if category:
        query += " AND e.category = ?"
        params.append(category)
    if status:
        query += " AND e.status = ?"
        params.append(status)
    if search:
        query += " AND (e.vendor LIKE ? OR e.description LIKE ?)"
        params.append(f"%{search}%")
        params.append(f"%{search}%")

    query += " ORDER BY e.date DESC, e.expense_id DESC"
    cursor.execute(query, params)
    expenses = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return expenses

@app.post("/expenses")
def create_expense(expense: ExpenseCreate, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    # Verify tour ownership only if trip_id is provided
    if expense.trip_id is not None:
        verify_tour_belongs_to_agency(cursor, expense.trip_id, agency_id)
    cursor.execute("""
    INSERT INTO expenses (trip_id, agency_id, amount, gst, vendor, category, date, time, description, payment_mode, approved_by, status, receipt_image, ocr_extracted_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
    (expense.trip_id, agency_id, expense.amount, expense.gst, expense.vendor, expense.category, expense.date, expense.time, expense.description, expense.payment_mode, expense.approved_by, expense.status, expense.receipt_image, expense.ocr_extracted_data))
    expense_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"message": "Expense created successfully", "expense_id": expense_id}

@app.get("/expenses/{expense_id}")
def get_expense(expense_id: int, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT e.* FROM expenses e
        LEFT JOIN tours t ON e.trip_id = t.trip_id
        WHERE e.expense_id = ? AND (t.agency_id = ? OR (e.trip_id IS NULL AND e.agency_id = ?))
    """, (expense_id, agency_id, agency_id))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Expense not found")
    return dict(row)

@app.put("/expenses/{expense_id}")
def update_expense_status(expense_id: int, status: str, approved_by: str, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE expenses SET status = ?, approved_by = ?
        WHERE expense_id = ? AND (
            trip_id IN (SELECT trip_id FROM tours WHERE agency_id = ?)
            OR (trip_id IS NULL AND agency_id = ?)
        )
    """, (status, approved_by, expense_id, agency_id, agency_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Expense not found")
    conn.commit()
    conn.close()
    return {"message": "Expense status updated successfully"}

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("""
        DELETE FROM expenses WHERE expense_id = ? AND (
            trip_id IN (SELECT trip_id FROM tours WHERE agency_id = ?)
            OR (trip_id IS NULL AND agency_id = ?)
        )
    """, (expense_id, agency_id, agency_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Expense not found")
    conn.commit()
    conn.close()
    return {"message": "Expense deleted successfully"}

# AI OCR Receipt Extraction Endpoint
@app.post("/expenses/ocr")
def extract_ocr_receipt(receipt_image: str):
    # Simulated Advanced AI OCR Extraction logic
    vendor = "Shell Fuel Station"
    if "toll" in receipt_image.lower():
        vendor = "NH-8 Toll Booth"
        amount = 350.0
        gst = 0.0
        category = "Toll"
    elif "hotel" in receipt_image.lower() or "stay" in receipt_image.lower():
        vendor = "Himalayan Lodge"
        amount = 4500.0
        gst = 810.0
        category = "Stay"
    else:
        amount = 1850.0
        gst = 333.0
        category = "Fuel"
        
    return {
        "extracted_data": {
            "vendor": vendor,
            "amount": amount,
            "gst": gst,
            "category": category,
            "date": "2026-07-05",
            "time": "12:30:15",
            "confidence_score": 0.98,
            "description": "Auto-extracted by Yatra AI OCR engine"
        }
    }

# 5. Vehicles Endpoints
@app.get("/vehicles")
def get_vehicles(agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vehicles WHERE agency_id = ? ORDER BY vehicle_number", (agency_id,))
    vehicles = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return vehicles

@app.post("/vehicles")
def create_vehicle(veh: VehicleCreate, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    # Check duplicate vehicle number for this agency
    cursor.execute("SELECT vehicle_number FROM vehicles WHERE vehicle_number = ? AND agency_id = ?", (veh.vehicle_number, agency_id))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Vehicle number already registered for this agency")
    cursor.execute("""
    INSERT INTO vehicles (vehicle_number, agency_id, model, owner, insurance, permit, fitness, puc, fuel_type, mileage, current_location, availability, service_history, expenses, upcoming_maintenance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
    (veh.vehicle_number, agency_id, veh.model, veh.owner, veh.insurance, veh.permit, veh.fitness, veh.puc, veh.fuel_type, veh.mileage, veh.current_location, veh.availability, veh.service_history, veh.expenses, veh.upcoming_maintenance))
    conn.commit()
    conn.close()
    return {"message": "Vehicle registered successfully"}

@app.get("/vehicles/{vehicle_number}")
def get_vehicle_details(vehicle_number: str, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vehicles WHERE vehicle_number = ? AND agency_id = ?", (vehicle_number, agency_id))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return dict(row)

@app.put("/vehicles/{vehicle_number}")
def update_vehicle(vehicle_number: str, availability: str, current_location: str, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("UPDATE vehicles SET availability = ?, current_location = ? WHERE vehicle_number = ? AND agency_id = ?", (availability, current_location, vehicle_number, agency_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Vehicle not found")
    conn.commit()
    conn.close()
    return {"message": "Vehicle updated successfully"}

@app.delete("/vehicles/{vehicle_number}")
def delete_vehicle(vehicle_number: str, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vehicles WHERE vehicle_number = ? AND agency_id = ?", (vehicle_number, agency_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Vehicle not found")
    conn.commit()
    conn.close()
    return {"message": "Vehicle deleted"}

# 6. Drivers Endpoints
@app.get("/drivers")
def get_drivers(agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM drivers WHERE agency_id = ? ORDER BY driver_id", (agency_id,))
    drivers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return drivers

@app.post("/drivers")
def create_driver(driver: DriverCreate, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO drivers (agency_id, name, license, aadhar, experience, trips_completed, assigned_tour, current_location, contact, emergency_contact, salary, expense, ratings, documents)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
    (agency_id, driver.name, driver.license, driver.aadhar, driver.experience, driver.trips_completed, driver.assigned_tour, driver.current_location, driver.contact, driver.emergency_contact, driver.salary, driver.expense, driver.ratings, driver.documents))
    conn.commit()
    conn.close()
    return {"message": "Driver added successfully"}

@app.delete("/drivers/{driver_id}")
def delete_driver(driver_id: int, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM drivers WHERE driver_id = ? AND agency_id = ?", (driver_id, agency_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Driver not found")
    conn.commit()
    conn.close()
    return {"message": "Driver deleted successfully"}

@app.get("/drivers/{driver_id}")
def get_driver_details(driver_id: int, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM drivers WHERE driver_id = ? AND agency_id = ?", (driver_id, agency_id))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Driver not found")
    return dict(row)

# 7. Customers Endpoints
@app.get("/customers")
def get_customers():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers")
    customers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return customers

@app.get("/customers/{customer_id}")
def get_customer_details(customer_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers WHERE customer_id = ?", (customer_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Customer not found")
    return dict(row)

# AI Itinerary Generator Endpoints
@app.post("/ai-itinerary")
def generate_ai_itinerary(destination: str, days: int, budget: str):
    # Simulated complex AI day-wise planner
    itinerary = []
    for day in range(1, days + 1):
        itinerary.append({
            "day": day,
            "morning": f"Explore central {destination} landmarks and local sight-seeing.",
            "afternoon": f"Lunch at top rated local diner, visit cultural heritage centers in {destination}.",
            "evening": f"Stroll around local market/beach area. Dinner and return to stay.",
            "recommendations": {
                "stay": f"Premium 4-Star Hotel in {destination} center",
                "food": "Highly rated vegetarian options",
                "transport": "Assigned Sedan/SUV fleet"
            }
        })
    return {
        "destination": destination,
        "total_days": days,
        "budget_bracket": budget,
        "day_wise_itinerary": itinerary,
        "metadata": {
            "tokens_consumed": 420,
            "engine": "Yatra-AI Itinerary Planner v4.1"
        }
    }

# 8. Invoice Generator Endpoints
@app.get("/invoices")
def get_invoices():
    # Build list of invoices based on completed tours and metadata
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tours WHERE status = 'Completed'")
    completed_tours = cursor.fetchall()
    
    invoices = []
    for tour in completed_tours:
        trip_id = tour["trip_id"]
        cursor.execute("SELECT SUM(amount) FROM expenses WHERE trip_id = ? AND status = 'Approved'", (trip_id,))
        exp_sum = cursor.fetchone()[0] or 0.0
        gst_calc = exp_sum * 0.18
        grand_total = exp_sum + gst_calc
        
        invoices.append({
            "invoice_id": 1000 + trip_id,
            "trip_id": trip_id,
            "customer": tour["customer"],
            "destination": tour["destination"],
            "start_date": tour["start_date"],
            "end_date": tour["end_date"],
            "expenses_total": exp_sum,
            "gst": gst_calc,
            "grand_total": grand_total,
            "payment_status": "Paid" if tour["timeline_status"] == "Payment Completed" else "Pending Payment",
            "outstanding_amount": 0.0 if tour["timeline_status"] == "Payment Completed" else grand_total,
            "qr_code_payload": f"upi://pay?pa=yatra@okaxis&am={grand_total}&tn=Trip{trip_id}",
            "digital_signature": "SHA256:8f921ea897cd021bc34e2c918ef0e980c6a38"
        })
        
    conn.close()
    return invoices

@app.get("/invoices/{trip_id}")
def generate_invoice_for_tour(trip_id: int, day: Optional[str] = None):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tours WHERE trip_id = ?", (trip_id,))
    tour_row = cursor.fetchone()
    if not tour_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Tour not found")
        
    tour = dict(tour_row)
    
    # Fetch expenses
    if day:
        cursor.execute("SELECT * FROM expenses WHERE trip_id = ? AND date = ? AND status = 'Approved'", (trip_id, day))
    else:
        cursor.execute("SELECT * FROM expenses WHERE trip_id = ? AND status = 'Approved'", (trip_id,))
        
    expenses = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    expenses_total = sum(e["amount"] for e in expenses)
    gst_total = sum(e["gst"] for e in expenses)
    grand_total = expenses_total + gst_total
    
    return {
        "agency_logo": "/yatralogo.jpg",
        "invoice_number": f"YATRA-{1000 + trip_id}",
        "customer": tour["customer"],
        "trip_id": trip_id,
        "destination": tour["destination"],
        "vehicle": tour["vehicle"],
        "driver": tour["driver"],
        "journey_dates": f"{tour['start_date']} to {tour['end_date']}",
        "billing_type": f"Day ({day})" if day else "Entire Tour",
        "expenses": expenses,
        "subtotal": expenses_total,
        "gst": gst_total,
        "grand_total": grand_total,
        "payment_status": "Paid" if tour['timeline_status'] == 'Payment Completed' else "Pending Payment",
        "qr_code": f"upi://pay?pa=yatra@okaxis&am={grand_total}&tn=Trip-{trip_id}",
        "digital_signature": "SHA256-DIGISIG-YATRA-981240182",
        "download_pdf_url": f"/invoices/download/{trip_id}",
        "email_sent_to": "client@example.com"
    }

@app.get("/invoices/download/{trip_id}")
def download_invoice_pdf(trip_id: int):
    # Returns PDF mock response headers
    return {
        "status": "success",
        "message": f"PDF invoice for trip #{trip_id} compiled successfully.",
        "download_url": f"/public/invoices/invoice_{trip_id}.pdf"
    }

# 9. Reports Endpoints
@app.get("/reports")
def generate_reports(report_type: str = Query(..., pattern="^(Expense|Profit|Tour|Vehicle|Driver|Customer|GST|Monthly|Yearly)$")):
    # Returns mock downloadable URL and reports summary
    return {
        "report_type": f"{report_type} Report",
        "generation_date": "2026-07-05",
        "summary": f"Aggregated {report_type.lower()} analysis metrics generated from live DB.",
        "export_links": {
            "csv": f"/reports/export/{report_type.lower()}?format=csv",
            "excel": f"/reports/export/{report_type.lower()}?format=xlsx",
            "pdf": f"/reports/export/{report_type.lower()}?format=pdf"
        }
    }

# 10. Notifications Endpoints
@app.get("/notifications")
def get_notifications(unread_only: bool = False):
    conn = get_db_conn()
    cursor = conn.cursor()
    if unread_only:
        cursor.execute("SELECT * FROM notifications WHERE read = 0 ORDER BY id DESC")
    else:
        cursor.execute("SELECT * FROM notifications ORDER BY id DESC")
    notifications = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return notifications

@app.put("/notifications/{notif_id}/read")
def mark_notification_as_read(notif_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET read = 1 WHERE id = ?", (notif_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Notification not found")
    conn.commit()
    conn.close()
    return {"message": "Notification marked as read"}

# Settings
@app.get("/settings")
def get_settings():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM settings")
    settings_dict = {row["key"]: row["value"] for row in cursor.fetchall()}
    conn.close()
    return settings_dict

@app.put("/settings/{key}")
def update_settings(key: str, payload: SettingsUpdate):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, payload.value))
    conn.commit()
    conn.close()
    return {"message": f"Setting '{key}' updated successfully."}
