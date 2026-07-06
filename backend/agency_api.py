import sqlite3
import json
import os
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

DB_PATH = "data/agency.db"

def get_db_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

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
    trip_id: int
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
def get_dashboard_summary():
    conn = get_db_conn()
    cursor = conn.cursor()
    
    # Revenue & Expenses & Profit
    cursor.execute("SELECT SUM(amount) FROM expenses WHERE status = 'Approved'")
    approved_expenses = cursor.fetchone()[0] or 0.0
    
    # Fetch settings currency / stats values as a baseline
    cursor.execute("SELECT COUNT(*) FROM tours WHERE status = 'Active'")
    active_tours = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT COUNT(*) FROM tours WHERE status = 'Completed'")
    completed_tours = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT COUNT(*) FROM vehicles")
    total_vehicles = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT COUNT(*) FROM drivers")
    total_drivers = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT COUNT(*) FROM tours WHERE status = 'Upcoming'")
    upcoming_tours = cursor.fetchone()[0] or 0
    
    # Calculate Today's / Monthly Expense from actual values or baseline
    cursor.execute("SELECT SUM(amount) FROM expenses WHERE date = DATE('now')")
    todays_expense = cursor.fetchone()[0] or 15000.0  # fallback mock if empty
    
    cursor.execute("SELECT SUM(amount) FROM expenses WHERE date LIKE '2026-07%'")
    monthly_expense = cursor.fetchone()[0] or 161000.0
    
    # Fallback/Seed values for display
    total_revenue = 2460000.0
    total_expenses = 1610000.0 + approved_expenses
    profit = total_revenue - total_expenses
    pending_payments = 180000.0
    
    # Notifications list
    cursor.execute("SELECT * FROM notifications ORDER BY id DESC LIMIT 5")
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
            "expense_trend": "↓ 5% this month"
        },
        "recent_notifications": notifications
    }

# 2. Charts Endpoint
@app.get("/dashboard/graphs")
def get_dashboard_graphs():
    return {
        "monthly_expense": {
            "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
            "data": [1.2, 1.4, 1.1, 1.6, 1.5, 1.3, 1.61]  # In Lakhs
        },
        "revenue_vs_expense": {
            "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
            "revenue": [1.8, 2.1, 1.9, 2.4, 2.8, 2.6, 3.1],
            "expense": [1.2, 1.4, 1.1, 1.6, 1.5, 1.3, 1.6]
        },
        "vehicle_usage": {
            "labels": ["MH-01-DK-4507", "MH-02-AB-9876", "MH-04-PQ-9102"],
            "days_active": [24, 18, 12]
        },
        "driver_performance": {
            "labels": ["Vikram", "Amit", "Suresh"],
            "ratings": [4.8, 4.6, 4.9]
        },
        "fuel_consumption": {
            "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
            "liters": [450, 520, 480, 610]
        },
        "category_wise_expense": {
            "labels": ["Stay", "Fuel", "Food", "Toll", "Maintenance", "Driver", "Misc"],
            "percentages": [35, 30, 17, 8, 5, 3, 2]
        },
        "tours_status": {
            "completed": 48,
            "upcoming": 8,
            "active": 12
        },
        "profit_trend": {
            "labels": ["Q1", "Q2", "Q3", "Q4"],
            "profit": [2.1, 2.8, 3.2, 4.1]
        }
    }

# 3. Tours Endpoints
@app.get("/tours")
def get_tours(status: Optional[str] = None):
    conn = get_db_conn()
    cursor = conn.cursor()
    if status:
        cursor.execute("SELECT * FROM tours WHERE status = ?", (status,))
    else:
        cursor.execute("SELECT * FROM tours")
    tours = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return tours

@app.post("/tours")
def create_tour(tour: TourCreate):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO tours (destination, customer, agency, start_date, end_date, status, vehicle, driver, passengers, guide, budget, current_lat, current_lng, timeline_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
    (tour.destination, tour.customer, tour.agency, tour.start_date, tour.end_date, tour.status, tour.vehicle, tour.driver, tour.passengers, tour.guide, tour.budget, tour.current_lat, tour.current_lng, tour.timeline_status))
    trip_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"message": "Tour created", "trip_id": trip_id}

@app.get("/tours/{trip_id}")
def get_tour_details(trip_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tours WHERE trip_id = ?", (trip_id,))
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
def update_tour(trip_id: int, status: str, timeline_status: Optional[str] = None):
    conn = get_db_conn()
    cursor = conn.cursor()
    if timeline_status:
        cursor.execute("UPDATE tours SET status = ?, timeline_status = ? WHERE trip_id = ?", (status, timeline_status, trip_id))
    else:
        cursor.execute("UPDATE tours SET status = ? WHERE trip_id = ?", (status, trip_id))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Tour not found")
    conn.commit()
    conn.close()
    return {"message": "Tour updated successfully"}

@app.delete("/tours/{trip_id}")
def delete_tour(trip_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tours WHERE trip_id = ?", (trip_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Tour not found")
    conn.commit()
    conn.close()
    return {"message": "Tour deleted successfully"}

# Journey Tracking Endpoints
@app.get("/tours/{trip_id}/journey")
def get_journey_tracking(trip_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT current_lat, current_lng, destination, vehicle, driver FROM tours WHERE trip_id = ?", (trip_id,))
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
def update_journey_location(trip_id: int, lat: float, lng: float):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("UPDATE tours SET current_lat = ?, current_lng = ? WHERE trip_id = ?", (lat, lng, trip_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Tour not found")
    conn.commit()
    conn.close()
    return {"message": "Location updated successfully"}

# Day-wise Expense breakdown
@app.get("/tours/{trip_id}/day-wise-expenses")
def get_day_wise_expenses(trip_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
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
def assign_vehicle_to_tour(trip_id: int, vehicle_number: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    
    # Verify vehicle availability
    cursor.execute("SELECT availability, model FROM vehicles WHERE vehicle_number = ?", (vehicle_number,))
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
def assign_driver_to_tour(trip_id: int, driver_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    
    cursor.execute("SELECT name, assigned_tour FROM drivers WHERE driver_id = ?", (driver_id,))
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
def get_tour_timeline(trip_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tour_timeline WHERE trip_id = ? ORDER BY id ASC", (trip_id,))
    timeline = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return timeline

@app.post("/tours/{trip_id}/timeline")
def add_timeline_event(trip_id: int, event_name: str, status: str = "Completed", updated_at: str = "2026-07-05 12:00:00"):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO tour_timeline (trip_id, event_name, status, updated_at) VALUES (?, ?, ?, ?)", (trip_id, event_name, status, updated_at))
    conn.commit()
    conn.close()
    return {"message": "Timeline event added"}

# Tour Analytics
@app.get("/tours/{trip_id}/analytics")
def get_tour_analytics(trip_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT budget, destination FROM tours WHERE trip_id = ?", (trip_id,))
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
def get_expenses(category: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None):
    conn = get_db_conn()
    cursor = conn.cursor()
    
    query = "SELECT * FROM expenses WHERE 1=1"
    params = []
    
    if category:
        query += " AND category = ?"
        params.append(category)
    if status:
        query += " AND status = ?"
        params.append(status)
    if search:
        query += " AND (vendor LIKE ? OR description LIKE ?)"
        params.append(f"%{search}%")
        params.append(f"%{search}%")
        
    cursor.execute(query, params)
    expenses = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return expenses

@app.post("/expenses")
def create_expense(expense: ExpenseCreate):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO expenses (trip_id, amount, gst, vendor, category, date, time, description, payment_mode, approved_by, status, receipt_image, ocr_extracted_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
    (expense.trip_id, expense.amount, expense.gst, expense.vendor, expense.category, expense.date, expense.time, expense.description, expense.payment_mode, expense.approved_by, expense.status, expense.receipt_image, expense.ocr_extracted_data))
    expense_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"message": "Expense created successfully", "expense_id": expense_id}

@app.get("/expenses/{expense_id}")
def get_expense(expense_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM expenses WHERE expense_id = ?", (expense_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Expense not found")
    return dict(row)

@app.put("/expenses/{expense_id}")
def update_expense_status(expense_id: int, status: str, approved_by: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("UPDATE expenses SET status = ?, approved_by = ? WHERE expense_id = ?", (status, approved_by, expense_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Expense not found")
    conn.commit()
    conn.close()
    return {"message": "Expense status updated successfully"}

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM expenses WHERE expense_id = ?", (expense_id,))
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
def get_vehicles():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vehicles")
    vehicles = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return vehicles

@app.post("/vehicles")
def create_vehicle(veh: VehicleCreate):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO vehicles (vehicle_number, model, owner, insurance, permit, fitness, puc, fuel_type, mileage, current_location, availability, service_history, expenses, upcoming_maintenance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
    (veh.vehicle_number, veh.model, veh.owner, veh.insurance, veh.permit, veh.fitness, veh.puc, veh.fuel_type, veh.mileage, veh.current_location, veh.availability, veh.service_history, veh.expenses, veh.upcoming_maintenance))
    conn.commit()
    conn.close()
    return {"message": "Vehicle registered successfully"}

@app.get("/vehicles/{vehicle_number}")
def get_vehicle_details(vehicle_number: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vehicles WHERE vehicle_number = ?", (vehicle_number,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return dict(row)

@app.put("/vehicles/{vehicle_number}")
def update_vehicle(vehicle_number: str, availability: str, current_location: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("UPDATE vehicles SET availability = ?, current_location = ? WHERE vehicle_number = ?", (availability, current_location, vehicle_number))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Vehicle not found")
    conn.commit()
    conn.close()
    return {"message": "Vehicle updated successfully"}

@app.delete("/vehicles/{vehicle_number}")
def delete_vehicle(vehicle_number: str):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM vehicles WHERE vehicle_number = ?", (vehicle_number,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Vehicle not found")
    conn.commit()
    conn.close()
    return {"message": "Vehicle deleted"}

# 6. Drivers Endpoints
@app.get("/drivers")
def get_drivers():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM drivers")
    drivers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return drivers

@app.post("/drivers")
def create_driver(driver: DriverCreate):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO drivers (name, license, aadhar, experience, trips_completed, assigned_tour, current_location, contact, emergency_contact, salary, expense, ratings, documents)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
    (driver.name, driver.license, driver.aadhar, driver.experience, driver.trips_completed, driver.assigned_tour, driver.current_location, driver.contact, driver.emergency_contact, driver.salary, driver.expense, driver.ratings, driver.documents))
    conn.commit()
    conn.close()
    return {"message": "Driver added successfully"}

@app.get("/drivers/{driver_id}")
def get_driver_details(driver_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM drivers WHERE driver_id = ?", (driver_id,))
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
def generate_reports(report_type: str = Query(..., regex="^(Expense|Profit|Tour|Vehicle|Driver|Customer|GST|Monthly|Yearly)$")):
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
