"""Schemas package — re-exports all models for convenience."""
from .agency import TourCreate, ExpenseCreate, VehicleCreate, DriverCreate, CustomerCreate, NotificationCreate, SettingsUpdate
from .traveller import TripCreate, BookingCreate, DocumentCreate, ProfileUpdate
from .traveller import ExpenseCreate as TravellerExpenseCreate
from .team import AgencyUpdate, TravellerUpdate, TicketUpdate, PlatformSettingUpdate
from .auth import SendOtpRequest, VerifyOtpRequest, LoginRequest, SetPasswordRequest, RefreshTokenRequest, LogoutRequest

__all__ = [
    "TourCreate", "ExpenseCreate", "VehicleCreate", "DriverCreate",
    "CustomerCreate", "NotificationCreate", "SettingsUpdate",
    "TripCreate", "TravellerExpenseCreate", "BookingCreate", "DocumentCreate", "ProfileUpdate",
    "AgencyUpdate", "TravellerUpdate", "TicketUpdate", "PlatformSettingUpdate",
    "SendOtpRequest", "VerifyOtpRequest", "LoginRequest", "SetPasswordRequest",
    "RefreshTokenRequest", "LogoutRequest",
]
