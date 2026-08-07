"""Quick test script to send an OTP and check SMTP email delivery."""
import urllib.request
import urllib.error
import json
import os

# Load .env if present
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                key, _, val = line.partition("=")
                # Strip inline comments
                val = val.split("#")[0].strip()
                os.environ.setdefault(key.strip(), val)

print("[TEST] Environment SMTP config:")
print(f"  SMTP_HOST    = {os.getenv('SMTP_HOST', '(not set)')}")
print(f"  SMTP_PORT    = {os.getenv('SMTP_PORT', '(not set)')}")
print(f"  SMTP_USER    = {os.getenv('SMTP_USER', '(not set)')}")
print(f"  SMTP_SENDER  = {os.getenv('SMTP_SENDER', '(not set)')}")
print(f"  SMTP_PASSWORD= {'(set)' if os.getenv('SMTP_PASSWORD') else '(not set)'}")

# Also test the email_helper directly
from email_helper import send_otp_email
print("\n[TEST] Triggering send_otp_email directly with OTP 123456...")
result = send_otp_email("urva546@gmail.com", "123456")
print(f"[TEST] send_otp_email returned: {result}")

# Also hit the live API
print("\n[TEST] Calling live API at http://localhost:8003/auth/send-otp ...")
body = json.dumps({"identifier": "urva546@gmail.com", "portal": "agency", "mode": "register", "name": "Urva"}).encode()
req = urllib.request.Request(
    "http://localhost:8003/auth/send-otp",
    data=body,
    headers={"Content-Type": "application/json"},
    method="POST"
)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())
        print(f"[TEST] API response: {data}")
        otp_val = data.get('otp')
        print(f"\n>>> OTP CODE: {otp_val} <<<")
        
        if otp_val:
            print("\n[TEST] Testing verify-otp with the received OTP...")
            v_body = json.dumps({
                "identifier": "urva546@gmail.com",
                "otp": otp_val,
                "portal": "agency",
                "mode": "register",
                "name": "Urva"
            }).encode()
            v_req = urllib.request.Request(
                "http://localhost:8003/auth/verify-otp",
                data=v_body,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(v_req, timeout=10) as v_resp:
                v_data = json.loads(v_resp.read())
                print(f"[TEST] verify-otp response: {v_data}")
except urllib.error.HTTPError as e:
    print(f"[TEST] HTTP Error {e.code}: {e.read().decode()}")
except Exception as ex:
    print(f"[TEST] Error: {ex}")
