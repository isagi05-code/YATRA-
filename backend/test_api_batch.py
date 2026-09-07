"""Test FastAPI batch OCR & batch expense endpoints using TestClient."""
from fastapi.testclient import TestClient
from main import app
from test_ocr_pipeline import create_mock_receipt_image

client = TestClient(app)

def test_api_ingress_validation():
    print("[API TEST 1] Ingress validation: Exceeding 5 receipts...")
    # Send 6 files
    files = [("files", (f"bill_{i}.jpg", create_mock_receipt_image(f"Pump {i}", 1000), "image/jpeg")) for i in range(6)]
    res = client.post("/expenses/ocr/batch", files=files)
    assert res.status_code == 400
    assert "Maximum 5 receipts allowed" in res.json()["detail"]
    print("  -> Passed: Correctly rejected 6 files.")


def test_api_batch_expense_creation():
    print("[API TEST 2] Batch expense creation in database...")
    batch_payload = [
        {
            "trip_id": None,
            "amount": 2500.0,
            "gst": 450.0,
            "vendor": "Automated Test Petrol Pump",
            "category": "Fuel",
            "date": "2026-09-06",
            "time": "15:00:00",
            "description": "Diesel fuel automated batch test",
            "payment_mode": "UPI",
            "approved_by": "Pending",
            "status": "Pending",
            "receipt_image": "test_pump.jpg",
            "ocr_extracted_data": '{"test": true}'
        },
        {
            "trip_id": None,
            "amount": 420.0,
            "gst": 0.0,
            "vendor": "NH-48 Toll Plaza",
            "category": "Toll",
            "date": "2026-09-06",
            "time": "16:20:00",
            "description": "FASTag toll crossing",
            "payment_mode": "FASTag",
            "approved_by": "Pending",
            "status": "Pending",
            "receipt_image": "test_toll.jpg",
            "ocr_extracted_data": '{"test": true}'
        }
    ]
    res = client.post("/expenses/batch?agency_id=AGY-1004", json=batch_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert len(data["created_ids"]) == 2
    print(f"  -> Passed: Successfully created batch of 2 expenses with IDs {data['created_ids']}")


if __name__ == "__main__":
    test_api_ingress_validation()
    test_api_batch_expense_creation()
    print("API ENDPOINT TESTS PASSED! [SUCCESS]")
