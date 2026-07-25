import os
import urllib.request
import urllib.parse
import json

def normalize_phone(phone: str) -> str:
    # Strip any characters except digits and '+'
    cleaned = "".join([c for c in phone if c.isdigit() or c == '+'])
    # Standardize +91 (India) country code
    # If the number is 10 digits, prepend +91
    if len(cleaned) == 10 and not cleaned.startswith('+'):
        cleaned = "+91" + cleaned
    elif len(cleaned) == 12 and cleaned.startswith('91'):
        cleaned = "+" + cleaned
    return cleaned

def send_actual_sms(phone_number: str, otp_code: str) -> bool:
    normalized = normalize_phone(phone_number)
    
    # 1. Fast2SMS Dev API (primarily for Indian phone numbers)
    fast2sms_key = os.getenv("FAST2SMS_API_KEY")
    if fast2sms_key:
        print(f"[SMS Gateway] Attempting to send OTP via Fast2SMS to {normalized}...")
        # Fast2SMS expects 10-digit number without country code
        clean_num = normalized.replace("+91", "").strip()
        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            params = {
                "authorization": fast2sms_key,
                "variables_values": str(otp_code),
                "route": "otp",
                "numbers": clean_num
            }
            query_string = urllib.parse.urlencode(params)
            req_url = f"{url}?{query_string}"
            req = urllib.request.Request(req_url, headers={"cache-control": "no-cache"})
            with urllib.request.urlopen(req, timeout=5) as res:
                res_data = json.loads(res.read().decode('utf-8'))
                if res_data.get("return") is True:
                    print(f"[SMS Gateway] Fast2SMS success: {res_data}")
                    return True
                else:
                    print(f"[SMS Gateway Error] Fast2SMS failed response: {res_data}")
        except Exception as e:
            print(f"[SMS Gateway Error] Fast2SMS request exception: {e}")

    # 2. Twilio API (international)
    twilio_sid = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_phone = os.getenv("TWILIO_PHONE_NUMBER")
    if twilio_sid and twilio_token and twilio_phone:
        print(f"[SMS Gateway] Attempting to send OTP via Twilio to {normalized}...")
        try:
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_token)
            message_body = f"Your Yatra AI verification code is: {otp_code}. Valid for 5 minutes."
            client.messages.create(
                body=message_body,
                from_=twilio_phone,
                to=normalized
            )
            print(f"[SMS Gateway] Twilio success: message sent to {normalized}")
            return True
        except ImportError:
            print("[SMS Gateway Error] Twilio library is not installed. Run: pip install twilio")
        except Exception as e:
            print(f"[SMS Gateway Error] Twilio exception: {e}")

    # Fallback to local console logging
    print(f"\n[SMS Simulation] Sent OTP {otp_code} to phone number {normalized}\n")
    return False
