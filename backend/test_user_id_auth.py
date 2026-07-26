import requests
import json

TRAVELLER_BASE = "http://localhost:8001"
AGENCY_BASE = "http://localhost:8000"

def test_traveller_flow():
    print("\n--- Testing Traveller Registration & Login ---")
    reg_email = "test.traveller@example.com"
    reg_name = "Test Traveller User"
    
    # 1. Send OTP for Register
    print("1. Sending OTP for Register...")
    res = requests.post(f"{TRAVELLER_BASE}/auth/send-otp", json={
        "email": reg_email,
        "mode": "register",
        "name": reg_name
    })
    print("Send OTP Response:", res.json())
    otp_code = res.json().get("otp")
    
    # 2. Verify OTP for Register
    print("2. Verifying OTP for Register...")
    res = requests.post(f"{TRAVELLER_BASE}/auth/verify-otp", json={
        "email": reg_email,
        "otp": otp_code,
        "mode": "register",
        "name": reg_name
    })
    user_data = res.json()
    print("Verify OTP Response:", json.dumps(user_data, indent=2))
    assert user_data["status"] == "success"
    user_id = user_data["user"]["user_id"]
    print(f"Generated User ID: {user_id}")
    
    # 3. Login using User ID!
    print(f"\n3. Logging in using User ID: {user_id} ...")
    res = requests.post(f"{TRAVELLER_BASE}/auth/send-otp", json={
        "email": user_id,
        "mode": "login"
    })
    print("Send OTP Response:", res.json())
    login_otp = res.json().get("otp")
    
    res = requests.post(f"{TRAVELLER_BASE}/auth/verify-otp", json={
        "email": user_id,
        "otp": login_otp,
        "mode": "login"
    })
    login_user_data = res.json()
    print("Login Response:", json.dumps(login_user_data, indent=2))
    assert login_user_data["user"]["user_id"] == user_id
    print("SUCCESS: Traveller logged in using User ID!")

def test_agency_flow():
    print("\n--- Testing Agency Registration & Login ---")
    reg_email = "test.agency@example.com"
    reg_name = "Apex Tours Ltd"
    
    # 1. Send OTP for Register
    print("1. Sending OTP for Register...")
    res = requests.post(f"{AGENCY_BASE}/auth/send-otp", json={
        "email": reg_email,
        "mode": "register",
        "name": reg_name
    })
    print("Send OTP Response:", res.json())
    otp_code = res.json().get("otp")
    
    # 2. Verify OTP for Register
    print("2. Verifying OTP for Register...")
    res = requests.post(f"{AGENCY_BASE}/auth/verify-otp", json={
        "email": reg_email,
        "otp": otp_code,
        "mode": "register",
        "name": reg_name
    })
    user_data = res.json()
    print("Verify OTP Response:", json.dumps(user_data, indent=2))
    assert user_data["status"] == "success"
    agency_id = user_data["user"]["agency_id"]
    print(f"Generated Agency ID: {agency_id}")
    
    # 3. Login using Agency ID!
    print(f"\n3. Logging in using Agency ID: {agency_id} ...")
    res = requests.post(f"{AGENCY_BASE}/auth/send-otp", json={
        "email": agency_id,
        "mode": "login"
    })
    print("Send OTP Response:", res.json())
    login_otp = res.json().get("otp")
    
    res = requests.post(f"{AGENCY_BASE}/auth/verify-otp", json={
        "email": agency_id,
        "otp": login_otp,
        "mode": "login"
    })
    login_user_data = res.json()
    print("Login Response:", json.dumps(login_user_data, indent=2))
    assert login_user_data["user"]["agency_id"] == agency_id
    print("SUCCESS: Agency logged in using Agency ID!")

if __name__ == "__main__":
    test_traveller_flow()
    test_agency_flow()
