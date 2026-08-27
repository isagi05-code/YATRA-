"""Pydantic schemas for the Auth API."""
from typing import Optional
from pydantic import BaseModel, root_validator


class SendOtpRequest(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None
    portal: Optional[str] = "agency"
    mode: str        # "register" | "login"
    name: Optional[str] = None

    @root_validator(pre=True)
    def normalize_identifier(cls, values):
        if not values.get("identifier") and values.get("email"):
            values["identifier"] = values.get("email")
        return values


class VerifyOtpRequest(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None
    otp: str
    portal: Optional[str] = "agency"
    mode: str
    name: Optional[str] = None
    phone: Optional[str] = None

    @root_validator(pre=True)
    def normalize_identifier(cls, values):
        if not values.get("identifier") and values.get("email"):
            values["identifier"] = values.get("email")
        return values


class LoginRequest(BaseModel):
    identifier: Optional[str] = None
    email: Optional[str] = None
    password: str
    portal: Optional[str] = "agency"

    @root_validator(pre=True)
    def normalize_identifier(cls, values):
        if not values.get("identifier") and values.get("email"):
            values["identifier"] = values.get("email")
        return values


class SetPasswordRequest(BaseModel):
    identifier: str
    portal: Optional[str] = "agency"
    password: str
    confirm_password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None
