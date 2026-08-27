"""Pydantic schemas for the Agency API."""
from typing import Optional
from pydantic import BaseModel


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
