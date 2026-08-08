"""Pydantic schemas for the Traveller API."""
from typing import Optional
from pydantic import BaseModel


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
