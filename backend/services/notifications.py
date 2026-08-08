"""Single import point for the project’s email and SMS delivery helpers."""
from email_helper import send_otp_email
from sms_helper import normalize_phone, send_actual_sms

__all__ = ['normalize_phone', 'send_actual_sms', 'send_otp_email']
