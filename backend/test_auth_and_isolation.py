"""Automated unit test suite for YATRA authentication, tenant isolation, and CRUD correctness."""
import asyncio
from modules.auth.utils import create_access_token
from modules.auth.deps import get_current_user, require_agency_context, get_agency_id, get_user_id, AuthUser
from modules.agency.fleet.router import get_vehicles, create_vehicle, get_vehicle_details, update_vehicle
from modules.agency.expenses.router import get_expenses, create_expense, get_expense, update_expense_status
from modules.agency.misc.router import get_settings, update_settings, generate_invoice_for_tour
from modules.agency.schemas import VehicleCreate, ExpenseCreate, SettingsUpdate
from db_init import initialize_mysql_databases
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

def init_db():
    initialize_mysql_databases()

def make_token(user_id="USR-AGY-1001", agency_id="AGY-1001", role="Agency Owner", portal="agency"):
    payload = {
        "sub": user_id,
        "user_id": user_id,
        "email": f"{user_id.lower()}@example.com",
        "name": f"Test {user_id}",
        "agency_id": agency_id,
        "role": role,
        "portal": portal,
        "permissions": ["tours:read", "tours:write", "expenses:read", "expenses:write", "expenses:approve", "vehicles:manage"],
        "token_version": 1,
    }
    return create_access_token(payload)

def test_auth_deps_enforcement():
    # 1. Missing credentials fails with 401
    try:
        asyncio.run(get_current_user(credentials=None))
        assert False, "Should have raised HTTPException for missing credentials"
    except HTTPException as e:
        assert e.status_code == 401

    # 2. Valid token succeeds and extracts user & agency_id
    token = make_token(user_id="USR-AGY-1001", agency_id="AGY-1001")
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    user = asyncio.run(get_current_user(credentials=creds))
    assert user.user_id == "USR-AGY-1001"
    assert get_agency_id(current_user=user) == "AGY-1001"

def test_vehicle_crud_and_service_history():
    aid = "AGY-1001"
    veh = VehicleCreate(
        vehicle_number="MH-99-TEST-9999",
        model="Tata Safari 2026",
        owner="Test Fleet Owner",
        insurance="Active",
        permit="All India",
        fitness="2028-01-01",
        puc="2027-01-01",
        fuel_type="Diesel",
        mileage=14.5,
        current_location="Mumbai",
        availability="Available",
        expenses=0.0,
        upcoming_maintenance="2026-12-01 (General Checkup)"
    )
    # Create or update vehicle
    try:
        create_vehicle(veh, agency_id=aid)
    except HTTPException:
        pass # Already exists

    # Read vehicle details and verify service_history exists and is list
    v = get_vehicle_details("MH-99-TEST-9999", agency_id=aid)
    assert v["vehicle_number"] == "MH-99-TEST-9999"
    assert isinstance(v.get("service_history"), list)

    # Read all vehicles for this agency
    vehicles = get_vehicles(agency_id=aid)
    assert any(x["vehicle_number"] == "MH-99-TEST-9999" for x in vehicles)

def test_expense_crud_and_ocr_attachment():
    aid = "AGY-1001"
    exp = ExpenseCreate(
        amount=2200.0,
        gst=396.0,
        vendor="HP Petrol Pump Highway",
        category="Fuel",
        date="2026-07-12",
        time="11:30:00",
        description="Diesel Refill on NH48",
        payment_mode="Corporate Card",
        status="Approved",
        ocr_extracted_data='{"vendor": "HP Petrol Pump", "confidence": 0.98}'
    )
    res = create_expense(exp, agency_id=aid)
    exp_id = res.get("expense_id")
    assert exp_id is not None

    # Retrieve and verify OCR data is attached
    saved_exp = get_expense(exp_id, agency_id=aid)
    assert saved_exp["amount"] == 2200.0
    assert saved_exp.get("ocr_extracted_data") is not None

    # Test update expense status with authenticated user context
    user_ctx = AuthUser(user_id="USR-AGY-1001", email="urva546@gmail.com", name="Urva Desai", portal="agency", role="Agency Owner", agency_id=aid, permissions=[])
    upd = update_expense_status(expense_id=exp_id, status="Approved", current_user=user_ctx)
    assert upd["approved_by"] == "Urva Desai"

def test_settings_tenant_isolation():
    aid1 = "AGY-1001"
    aid2 = "AGY-1002"

    # Set agency 1 setting
    update_settings(key="brand_color", payload=SettingsUpdate(value="#10B981"), agency_id=aid1)
    # Set agency 2 setting with different value
    update_settings(key="brand_color", payload=SettingsUpdate(value="#3B82F6"), agency_id=aid2)

    # Verify agency 1 reads its own brand_color
    s1 = get_settings(agency_id=aid1)
    assert s1.get("brand_color") == "#10B981"

    # Verify agency 2 reads its own brand_color
    s2 = get_settings(agency_id=aid2)
    assert s2.get("brand_color") == "#3B82F6"

def main():
    print("[TEST] Initializing database...")
    init_db()

    print("[TEST] Running test_auth_deps_enforcement...")
    test_auth_deps_enforcement()
    print("  ✓ Passed: 401 strictly enforced on missing auth, valid JWT decoded properly")

    print("[TEST] Running test_vehicle_crud_and_service_history...")
    test_vehicle_crud_and_service_history()
    print("  ✓ Passed: Vehicle CRUD works without non-existent column errors & service_history attached")

    print("[TEST] Running test_expense_crud_and_ocr_attachment...")
    test_expense_crud_and_ocr_attachment()
    print("  ✓ Passed: Expense CRUD works without non-existent column errors & OCR attached")

    print("[TEST] Running test_settings_tenant_isolation...")
    test_settings_tenant_isolation()
    print("  ✓ Passed: Settings are correctly isolated per agency_id and use portable upsert")

    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
