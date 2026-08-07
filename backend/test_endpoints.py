import urllib.request
import json
import time

def test_api(url, name):
    try:
        response = urllib.request.urlopen(url, timeout=3)
        data = json.loads(response.read().decode())
        print(f"[OK] {name} responds successfully: {url}")
        return True
    except Exception as e:
        print(f"[FAIL] {name} check failed on {url}: {e}")
        return False

def run_tests():
    print("Testing Yatra AI Backend services endpoints...\n")
    
    tests = [
        # Agency
        ("http://127.0.0.1:8000/dashboard/summary", "Agency Dashboard Summary"),
        ("http://127.0.0.1:8000/dashboard/graphs", "Agency Dashboard Charts"),
        ("http://127.0.0.1:8000/tours", "Agency Tours list"),
        ("http://127.0.0.1:8000/expenses", "Agency Expenses list"),
        ("http://127.0.0.1:8000/vehicles", "Agency Fleet list"),
        ("http://127.0.0.1:8000/drivers", "Agency Drivers list"),
        ("http://127.0.0.1:8000/customers", "Agency Customers list"),
        
        # Traveller
        ("http://127.0.0.1:8001/dashboard/summary", "Traveller Dashboard Summary"),
        ("http://127.0.0.1:8001/trips", "Traveller Trips list"),
        ("http://127.0.0.1:8001/expenses", "Traveller Expenses"),
        ("http://127.0.0.1:8001/expenses/analytics", "Traveller Expenses Charts"),
        
        # Yatra Team
        ("http://127.0.0.1:8002/dashboard/summary", "Yatra Team Admin Summary"),
        ("http://127.0.0.1:8002/agencies", "Yatra Team Agency List"),
        ("http://127.0.0.1:8002/travellers", "Yatra Team Traveller List"),
        ("http://127.0.0.1:8002/health", "Yatra Team Health Status"),
        ("http://127.0.0.1:8002/ai-usage", "Yatra Team AI Token usage logs")
    ]
    
    success = True
    for url, name in tests:
        if not test_api(url, name):
            success = False
            
    if success:
        print("\nAll system verification tests passed successfully!")
    else:
        print("\nSome system verification tests failed. Please inspect logs.")

if __name__ == "__main__":
    # Wait a second to allow servers to boots up fully
    time.sleep(1)
    run_tests()
