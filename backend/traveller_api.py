import sqlite3
import json
import os
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

DB_PATH = "data/traveller.db"

def get_db_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Pydantic models
class ExpenseCreate(BaseModel):
    title: str
    amount: float
    date: str
    category: str
    status: str = "Paid"

class TripCreate(BaseModel):
    name: str
    route: str
    date: str
    duration: str
    budget: float
    status: str = "Booked"
    driver: Optional[str] = "None"
    vehicle: Optional[str] = "None"

class BookingCreate(BaseModel):
    trip_id: int
    name: str
    status: str
    details: str

class DocumentCreate(BaseModel):
    name: str
    type: str
    file_url: str
    upload_date: str

class ProfileUpdate(BaseModel):
    name: str
    email: str
    contact: str
    preferences: str

# Endpoints
@app.get("/dashboard/summary")
def get_dashboard_summary():
    conn = get_db_conn()
    cursor = conn.cursor()
    
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
def get_trips(status: Optional[str] = None):
    conn = get_db_conn()
    cursor = conn.cursor()
    if status:
        cursor.execute("SELECT * FROM trips WHERE status = ?", (status,))
    else:
        cursor.execute("SELECT * FROM trips")
    trips = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return trips

@app.post("/trips")
def create_trip(trip: TripCreate):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO trips (name, route, date, duration, budget, status, driver, vehicle)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
    (trip.name, trip.route, trip.date, trip.duration, trip.budget, trip.status, trip.driver, trip.vehicle))
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
def get_expenses(category: Optional[str] = None):
    conn = get_db_conn()
    cursor = conn.cursor()
    if category:
        cursor.execute("SELECT * FROM expenses WHERE category = ?", (category,))
    else:
        cursor.execute("SELECT * FROM expenses")
    expenses = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return expenses

@app.post("/expenses")
def create_expense(exp: ExpenseCreate):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO expenses (title, amount, date, category, status)
    VALUES (?, ?, ?, ?, ?)""",
    (exp.title, exp.amount, exp.date, exp.category, exp.status))
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
def get_expenses_analytics():
    conn = get_db_conn()
    cursor = conn.cursor()
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
def get_bookings():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings")
    bookings = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return bookings

@app.post("/bookings")
def create_booking(bk: BookingCreate):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO bookings (trip_id, name, status, details) VALUES (?, ?, ?, ?)",
    (bk.trip_id, bk.name, bk.status, bk.details))
    conn.commit()
    conn.close()
    return {"message": "Booking added successfully"}

# Documents Endpoints
@app.get("/documents")
def get_documents():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents")
    docs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return docs

@app.post("/documents")
def upload_document(doc: DocumentCreate):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO documents (name, type, file_url, upload_date) VALUES (?, ?, ?, ?)",
    (doc.name, doc.type, doc.file_url, doc.upload_date))
    conn.commit()
    conn.close()
    return {"message": "Document uploaded successfully"}

# Profile & Settings Endpoints
@app.get("/profile")
def get_profile():
    conn = get_db_conn()
    cursor = conn.cursor()
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
    cursor.execute("UPDATE profile SET name = ?, email = ?, contact = ?, preferences = ? WHERE id = 1",
    (prof.name, prof.email, prof.contact, prof.preferences))
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
