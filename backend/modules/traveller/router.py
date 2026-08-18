"""Traveller API router — trips, expenses, bookings, documents, profile, dashboard."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from core.database import get_db_conn as get_mysql_conn
from modules.traveller.schemas import TripCreate, ExpenseCreate, BookingCreate, DocumentCreate, ProfileUpdate
from modules.auth.deps import get_user_id

router = APIRouter(tags=["Traveller"])


def get_db_conn():
    return get_mysql_conn("yatra_traveller")


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard/summary")
def get_dashboard_summary(user_id: str = Depends(get_user_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM trips WHERE user_id = ?", (user_id,))
    trips_count = cursor.fetchone()[0] or 0
    cursor.execute("SELECT SUM(amount) FROM expenses WHERE user_id = ?", (user_id,))
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
def get_trips(status: Optional[str] = None, user_id: str = Depends(get_user_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    query = "SELECT * FROM trips WHERE user_id = ?"
    params = [user_id]
    if status:
        query += " AND status = ?"
        params.append(status)
    cursor.execute(query, params)
    trips = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return trips


@router.post("/trips")
def create_trip(trip: TripCreate, user_id: str = Depends(get_user_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO trips (user_id, name, route, date, duration, budget, status, driver, vehicle)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
    (user_id, trip.name, trip.route, trip.date, trip.duration, trip.budget, trip.status, trip.driver, trip.vehicle))
    trip_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"message": "Trip created successfully", "trip_id": trip_id}


@router.get("/trips/{trip_id}")
def get_trip_details(trip_id: int, user_id: str = Depends(get_user_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM trips WHERE id = ? AND user_id = ?", (trip_id, user_id))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Trip not found")
    return dict(row)


# ── Expenses ──────────────────────────────────────────────────────────────────

@router.get("/expenses/analytics")
def get_expenses_analytics(user_id: str = Depends(get_user_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT category, SUM(amount) FROM expenses WHERE user_id = ? GROUP BY category", (user_id,))
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
def get_expenses(category: Optional[str] = None, user_id: str = Depends(get_user_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    query = "SELECT * FROM expenses WHERE user_id = ?"
    params = [user_id]
    if category:
        query += " AND category = ?"
        params.append(category)
    cursor.execute(query, params)
    expenses = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return expenses


@router.post("/expenses")
def create_expense(exp: ExpenseCreate, user_id: str = Depends(get_user_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO expenses (user_id, title, amount, date, category, status)
    VALUES (?, ?, ?, ?, ?, ?)""",
    (user_id, exp.title, exp.amount, exp.date, exp.category, exp.status))
    exp_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"message": "Expense added successfully", "expense_id": exp_id}


@router.delete("/expenses/{exp_id}")
def delete_expense(exp_id: int, user_id: str = Depends(get_user_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM expenses WHERE id = ? AND user_id = ?", (exp_id, user_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Expense not found")
    conn.commit()
    conn.close()
    return {"message": "Expense deleted successfully"}


# ── Bookings ──────────────────────────────────────────────────────────────────

@router.get("/bookings")
def get_bookings(user_id: str = Depends(get_user_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings WHERE user_id = ?", (user_id,))
    bookings = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return bookings


@router.post("/bookings")
def create_booking(bk: BookingCreate, user_id: str = Depends(get_user_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO bookings (user_id, trip_id, name, status, details) VALUES (?, ?, ?, ?, ?)",
    (user_id, bk.trip_id, bk.name, bk.status, bk.details))
    conn.commit()
    conn.close()
    return {"message": "Booking added successfully"}


# ── Documents ─────────────────────────────────────────────────────────────────

@router.get("/documents")
def get_documents(user_id: str = Depends(get_user_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE user_id = ?", (user_id,))
    docs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return docs


@router.post("/documents")
def upload_document(doc: DocumentCreate, user_id: str = Depends(get_user_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO documents (user_id, name, type, file_url, upload_date) VALUES (?, ?, ?, ?, ?)",
    (user_id, doc.name, doc.type, doc.file_url, doc.upload_date))
    conn.commit()
    conn.close()
    return {"message": "Document uploaded successfully"}


# ── Profile & Settings ────────────────────────────────────────────────────────

@router.get("/profile")
def get_profile(user_id: str = Depends(get_user_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM profile WHERE LOWER(user_id) = ?", (user_id.lower(),))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {}
    return dict(row)


@router.put("/profile")
def update_profile(prof: ProfileUpdate, user_id: str = Depends(get_user_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("UPDATE profile SET name = ?, email = ?, contact = ?, preferences = ? WHERE LOWER(user_id) = ?",
    (prof.name, prof.email, prof.contact, prof.preferences, user_id.lower()))
    conn.commit()
    conn.close()
    return {"message": "Profile updated successfully"}


@router.get("/settings")
def get_settings(user_id: str = Depends(get_user_id)):
    return {
        "notifications_enabled": True,
        "theme": "dark",
        "currency_preference": "INR",
        "auto_sync_bookings": True
    }