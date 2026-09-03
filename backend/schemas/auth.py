"""Pydantic schemas for the Auth API."""
from typing import Optional
from pydantic import BaseModel

try:
    # Pydantic v2 — use model_validator
    from pydantic import model_validator

    class _NormalizeIdentifierMixin(BaseModel):
        @model_validator(mode="before")
        @classmethod
        def _normalize_identifier(cls, values):
            if isinstance(values, dict) and not values.get("identifier") and values.get("email"):
                values["identifier"] = values["email"]
            return values

except ImportError:
    # Pydantic v1 — use root_validator
    from pydantic import root_validator  # type: ignore

    class _NormalizeIdentifierMixin(BaseModel):  # type: ignore[no-redef]
        @root_validator(pre=True)
        def _normalize_identifier(cls, values):
            if not values.get("identifier") and values.get("email"):
                values["identifier"] = values.get("email")
            return values


class SendOtpRequest(_NormalizeIdentifierMixin):
    identifier: Optional[str] = None
    email: Optional[str] = None
    portal: Optional[str] = "agency"
    mode: str        # "register" | "login" | "reset"
    name: Optional[str] = None


class VerifyOtpRequest(_NormalizeIdentifierMixin):
    identifier: Optional[str] = None
    email: Optional[str] = None
    otp: str
    portal: Optional[str] = "agency"
    mode: str
    name: Optional[str] = None
    phone: Optional[str] = None


class LoginRequest(_NormalizeIdentifierMixin):
    identifier: Optional[str] = None
    email: Optional[str] = None
    password: str
    portal: Optional[str] = "agency"


class SetPasswordRequest(BaseModel):
    identifier: str
    portal: Optional[str] = "agency"
    otp: str          # OTP verification required before password can be set
    password: str
    confirm_password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None
