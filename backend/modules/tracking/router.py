from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from datetime import datetime

from core.database import get_db_conn
from modules.auth.deps import get_agency_id, AuthUser, require_agency_context

router = APIRouter(prefix="/tracking", tags=["GPS Tracking"])

class LocationPingCreate(BaseModel):
    entity_type: str = Field(..., description="'Vehicle', 'Driver', or 'Traveller'")
    entity_id: str = Field(..., description="ID of the vehicle, driver, or traveller")
    trip_id: Optional[int] = None
    latitude: float
    longitude: float
    speed: Optional[float] = None
    heading: Optional[float] = None
    accuracy: Optional[float] = None

class LocationPingResponse(BaseModel):
    ping_id: int
    entity_type: str
    entity_id: str
    trip_id: Optional[int]
    latitude: float
    longitude: float
    speed: Optional[float]
    heading: Optional[float]
    accuracy: Optional[float]
    timestamp: datetime

def get_ent_db_conn():
    return get_db_conn("yatra_enterprise")

@router.post("/ping", response_model=dict)
def add_location_ping(ping: LocationPingCreate, current_user: AuthUser = Depends(require_agency_context)):
    conn = get_ent_db_conn()
    cursor = conn.cursor()
    
    # In a real scenario, you'd want to verify the entity_id belongs to the agency
    # For now, we allow the agency context to post pings.

    query = """
    INSERT INTO location_pings 
    (entity_type, entity_id, trip_id, latitude, longitude, speed, heading, accuracy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    try:
        cursor.execute(query, (
            ping.entity_type, ping.entity_id, ping.trip_id,
            ping.latitude, ping.longitude,
            ping.speed, ping.heading, ping.accuracy
        ))
        ping_id = cursor.lastrowid
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to insert ping: {str(e)}")
    finally:
        conn.close()
        
    return {"message": "Location updated", "ping_id": ping_id}

@router.get("/history/{entity_type}/{entity_id}")
def get_location_history(
    entity_type: str, 
    entity_id: str, 
    hours: int = Query(24, description="Hours of history to retrieve"),
    current_user: AuthUser = Depends(require_agency_context)
):
    conn = get_ent_db_conn()
    cursor = conn.cursor()
    
    query = """
    SELECT * FROM location_pings
    WHERE entity_type = ? AND entity_id = ?
    AND timestamp >= DATETIME('now', ?)
    ORDER BY timestamp ASC
    """
    
    try:
        time_modifier = f"-{hours} hours"
        cursor.execute(query, (entity_type, entity_id, time_modifier))
        rows = cursor.fetchall()
        
        return [dict(row) for row in rows]
    finally:
        conn.close()

@router.get("/live/{trip_id}")
def get_live_trip_locations(trip_id: int, current_user: AuthUser = Depends(require_agency_context)):
    """
    Get the latest location for all entities associated with a given trip.
    """
    conn = get_ent_db_conn()
    cursor = conn.cursor()
    
    # We use a subquery to get the latest ping per entity for this trip
    query = """
    SELECT p.* FROM location_pings p
    INNER JOIN (
        SELECT entity_type, entity_id, MAX(timestamp) as max_time
        FROM location_pings
        WHERE trip_id = ?
        GROUP BY entity_type, entity_id
    ) latest ON p.entity_type = latest.entity_type 
             AND p.entity_id = latest.entity_id 
             AND p.timestamp = latest.max_time
    WHERE p.trip_id = ?
    """
    
    try:
        cursor.execute(query, (trip_id, trip_id))
        rows = cursor.fetchall()
        
        return [dict(row) for row in rows]
    finally:
        conn.close()
