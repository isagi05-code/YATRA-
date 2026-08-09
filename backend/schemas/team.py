"""Pydantic schemas for the Team Admin API."""
from pydantic import BaseModel


class AgencyUpdate(BaseModel):
    status: str
    subscription_status: str


class TravellerUpdate(BaseModel):
    name: str
    email: str


class TicketUpdate(BaseModel):
    status: str


class PlatformSettingUpdate(BaseModel):
    value: str
