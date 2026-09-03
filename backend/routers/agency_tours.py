"""Agency Tours router — /tours CRUD + journey, timeline, analytics."""
from typing import Optional
from fastapi import APIRouter, HTTPException
from core.database import get_db_conn as get_mysql_conn
from schemas.agency import TourCreate

router = APIRouter(prefix="/tours", tags=["Agency Tours"])


def get_db_conn():
    return get_mysql_conn("yatra_enterprise")


def require_agency_id(agency_id: Optional[str]) -> str:
    return agency_id or "AGY-1001"


def verify_tour_belongs_to_agency(cursor, trip_id: int, agency_id: str):
    cursor.execute("SELECT agency_id FROM tours WHERE trip_id = ?", (trip_id,))
    row = cursor.fetchone()
    if not row or row["agency_id"] != agency_id:
        raise HTTPException(status_code=404, detail="Tour not found for this agency")
    return row


@router.get("")
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


@router.post("")
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


@router.get("/{trip_id}")
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
    cursor.execute("SELECT * FROM tour_stops WHERE trip_id = ?", (trip_id,))
    tour["stops"] = [dict(row) for row in cursor.fetchall()]
    cursor.execute("SELECT * FROM tour_timeline WHERE trip_id = ?", (trip_id,))
    tour["timeline"] = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return tour


@router.put("/{trip_id}")
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


@router.delete("/{trip_id}")
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


@router.get("/{trip_id}/journey")
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


@router.put("/{trip_id}/journey")
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


@router.get("/{trip_id}/day-wise-expenses")
def get_day_wise_expenses(trip_id: int, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    verify_tour_belongs_to_agency(cursor, trip_id, agency_id)
    cursor.execute("SELECT * FROM expenses WHERE trip_id = ?", (trip_id,))
    expenses_list = [dict(row) for row in cursor.fetchall()]
    conn.close()
    day_wise = {}
    grand_total = 0.0
    for exp in expenses_list:
        date = exp["date"]
        category = exp["category"]
        amount = exp["amount"]
        grand_total += amount
        if date not in day_wise:
            day_wise[date] = {"Food": 0, "Fuel": 0, "Hotel": 0, "Stay": 0, "Toll": 0, "Maintenance": 0, "Driver": 0, "Misc": 0, "Total": 0}
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
    return {"trip_id": trip_id, "day_wise_breakdown": day_wise, "grand_total": grand_total}


@router.put("/{trip_id}/vehicle-assignment")
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
    cursor.execute("UPDATE tours SET vehicle = ? WHERE trip_id = ?", (vehicle_number, trip_id))
    cursor.execute("UPDATE vehicles SET availability = 'Assigned' WHERE vehicle_number = ?", (vehicle_number,))
    conn.commit()
    conn.close()
    return {"message": f"Vehicle {vehicle_number} ({veh['model']}) assigned to trip {trip_id} successfully."}


@router.put("/{trip_id}/driver-assignment")
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


@router.get("/{trip_id}/timeline")
def get_tour_timeline(trip_id: int, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    verify_tour_belongs_to_agency(cursor, trip_id, agency_id)
    cursor.execute("SELECT * FROM tour_timeline WHERE trip_id = ? ORDER BY id ASC", (trip_id,))
    timeline = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return timeline


@router.post("/{trip_id}/timeline")
def add_timeline_event(trip_id: int, event_name: str, status: str = "Completed", updated_at: str = "2026-07-05 12:00:00", agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    verify_tour_belongs_to_agency(cursor, trip_id, agency_id)
    cursor.execute("INSERT INTO tour_timeline (trip_id, event_name, status, updated_at) VALUES (?, ?, ?, ?)", (trip_id, event_name, status, updated_at))
    conn.commit()
    conn.close()
    return {"message": "Timeline event added"}


@router.get("/{trip_id}/analytics")
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
    profit = tour["budget"] - exp_sum
    return {
        "trip_id": trip_id,
        "destination": tour["destination"],
        "distance_covered_km": 320.0,
        "fuel_used_liters": 32.5,
        "average_mileage": 9.8,
        "total_budget": tour["budget"],
        "total_expenses": exp_sum,
        "profit": profit,
        "customer_rating": 4.8
    }
