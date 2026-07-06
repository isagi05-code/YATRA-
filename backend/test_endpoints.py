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
        ("http://localhost:8000/dashboard/summary", "Agency Dashboard Summary"),
        ("http://localhost:8000/dashboard/graphs", "Agency Dashboard Charts"),
        ("http://localhost:8000/tours", "Agency Tours list"),
        ("http://localhost:8000/expenses", "Agency Expenses list"),
        ("http://localhost:8000/vehicles", "Agency Fleet list"),
        ("http://localhost:8000/drivers", "Agency Drivers list"),
        ("http://localhost:8000/customers", "Agency Customers list"),
        
        # Traveller
        ("http://localhost:8001/dashboard/summary", "Traveller Dashboard Summary"),
        ("http://localhost:8001/trips", "Traveller Trips list"),
        ("http://localhost:8001/expenses", "Traveller Expenses"),
        ("http://localhost:8001/expenses/analytics", "Traveller Expenses Charts"),
        
        # Yatra Team
        ("http://localhost:8002/dashboard/summary", "Yatra Team Admin Summary"),
        ("http://localhost:8002/agencies", "Yatra Team Agency List"),
        ("http://localhost:8002/travellers", "Yatra Team Traveller List"),
        ("http://localhost:8002/health", "Yatra Team Health Status"),
        ("http://localhost:8002/ai-usage", "Yatra Team AI Token usage logs")
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
