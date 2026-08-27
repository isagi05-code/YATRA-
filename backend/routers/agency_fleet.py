"""Agency Fleet router — /vehicles and /drivers endpoints."""
from typing import Optional
from fastapi import APIRouter, HTTPException
from core.database import get_db_conn as get_mysql_conn
from schemas.agency import VehicleCreate, DriverCreate

router = APIRouter(tags=["Agency Fleet"])


def get_db_conn():
    return get_mysql_conn("yatra_agency")


def require_agency_id(agency_id: Optional[str]) -> str:
    return agency_id or "AGY-1001"


# ── Vehicles ──────────────────────────────────────────────────────────────────

@router.get("/vehicles")
def get_vehicles(agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vehicles WHERE agency_id = ? ORDER BY vehicle_number", (agency_id,))
    vehicles = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return vehicles


@router.post("/vehicles")
def create_vehicle(veh: VehicleCreate, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
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


@router.get("/vehicles/{vehicle_number}")
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


@router.put("/vehicles/{vehicle_number}")
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


@router.delete("/vehicles/{vehicle_number}")
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


# ── Drivers ───────────────────────────────────────────────────────────────────

@router.get("/drivers")
def get_drivers(agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM drivers WHERE agency_id = ? ORDER BY driver_id", (agency_id,))
    drivers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return drivers


@router.post("/drivers")
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


@router.delete("/drivers/{driver_id}")
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


@router.get("/drivers/{driver_id}")
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
