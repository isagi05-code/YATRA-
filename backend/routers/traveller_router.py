"""Traveller API router — trips, expenses, bookings, documents, profile, dashboard."""
from typing import Optional
from fastapi import APIRouter, HTTPException
from core.database import get_db_conn as get_mysql_conn
from schemas.traveller import TripCreate, ExpenseCreate, BookingCreate, DocumentCreate, ProfileUpdate

router = APIRouter(prefix="/traveller", tags=["Traveller"])


def get_db_conn():
    return get_mysql_conn("yatra_enterprise")


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard/summary")
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


# ── Trips ─────────────────────────────────────────────────────────────────────

@router.get("/trips")
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


@router.post("/trips")
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


@router.get("/trips/{trip_id}")
def get_trip_details(trip_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM trips WHERE id = ?", (trip_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Trip not found")
    return dict(row)


# ── Expenses ──────────────────────────────────────────────────────────────────

@router.get("/expenses/analytics")
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
        "daily_spending": {"labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], "data": [450, 1200, 300, 850, 1800, 2500, 600]},
        "weekly_spending": {"labels": ["Week 1", "Week 2", "Week 3", "Week 4"], "data": [3500, 4800, 2100, 5600]},
        "monthly_spending_trend": {"labels": ["Apr", "May", "Jun", "Jul"], "data": [12000, 15000, 9500, 16000]}
    }


@router.get("/expenses")
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


@router.post("/expenses")
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


@router.delete("/expenses/{exp_id}")
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


# ── Bookings ──────────────────────────────────────────────────────────────────

@router.get("/bookings")
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


@router.post("/bookings")
def create_booking(bk: BookingCreate):
    conn = get_db_conn()
    cursor = conn.cursor()
    uid = bk.user_id or "TRV-1001"
    cursor.execute("INSERT INTO bookings (user_id, trip_id, name, status, details) VALUES (?, ?, ?, ?, ?)",
    (uid, bk.trip_id, bk.name, bk.status, bk.details))
    conn.commit()
    conn.close()
    return {"message": "Booking added successfully"}


# ── Documents ─────────────────────────────────────────────────────────────────

@router.get("/documents")
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


@router.post("/documents")
def upload_document(doc: DocumentCreate):
    conn = get_db_conn()
    cursor = conn.cursor()
    uid = doc.user_id or "TRV-1001"
    cursor.execute("INSERT INTO documents (user_id, name, type, file_url, upload_date) VALUES (?, ?, ?, ?, ?)",
    (uid, doc.name, doc.type, doc.file_url, doc.upload_date))
    conn.commit()
    conn.close()
    return {"message": "Document uploaded successfully"}


# ── Profile & Settings ────────────────────────────────────────────────────────

@router.get("/profile")
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


@router.put("/profile")
def update_profile(prof: ProfileUpdate):
    conn = get_db_conn()
    cursor = conn.cursor()
    uid = prof.user_id or "TRV-1001"
    cursor.execute("UPDATE profile SET name = ?, email = ?, contact = ?, preferences = ? WHERE LOWER(user_id) = ? OR LOWER(email) = ?",
    (prof.name, prof.email, prof.contact, prof.preferences, uid.lower(), prof.email.lower()))
    conn.commit()
    conn.close()
    return {"message": "Profile updated successfully"}


@router.get("/settings")
def get_settings():
    return {
        "notifications_enabled": True,
        "theme": "dark",
        "currency_preference": "INR",
        "auto_sync_bookings": True
    }
