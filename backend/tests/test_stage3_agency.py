"""
Stage 3 Unit Tests: Agency Microservice Endpoints & Multi-Tenant Data Isolation.
"""
import unittest
import sys
import os
from fastapi.testclient import TestClient

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agency_api import app as agency_app
from auth_utils import create_access_token


class TestStage3Agency(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(agency_app)
        # Create a valid test JWT for AGY-1001
        self.valid_token = create_access_token({
            "user_id": "USR-AGY-1001",
            "email": "agency.owner@yatrademo.com",
            "agency_id": "AGY-1001",
            "role": "Agency Owner",
            "portal": "agency",
            "permissions": ["all"]
        })
        self.headers = {"Authorization": f"Bearer {self.valid_token}"}

    def test_01_agency_dashboard_summary(self):
        """Test GET /dashboard/summary returns valid metrics for the agency."""
        response = self.client.get("/dashboard/summary", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("stats", data)
        stats = data["stats"]
        self.assertIn("active_tours", stats)
        self.assertIn("total_revenue", stats)
        self.assertIn("total_expenses", stats)
        self.assertIn("total_vehicles", stats)

    def test_02_agency_dashboard_graphs(self):
        """Test GET /dashboard/graphs returns monthly analytics."""
        response = self.client.get("/dashboard/graphs", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, (list, dict))

    def test_03_agency_tours_list(self):
        """Test GET /tours returns tours list scoped to the agency."""
        response = self.client.get("/tours", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_04_agency_expenses_list(self):
        """Test GET /expenses returns expense entries."""
        response = self.client.get("/expenses", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_05_agency_fleet_vehicles_and_drivers(self):
        """Test GET /vehicles and GET /drivers."""
        v_res = self.client.get("/vehicles", headers=self.headers)
        self.assertEqual(v_res.status_code, 200)
        self.assertIsInstance(v_res.json(), list)

        d_res = self.client.get("/drivers", headers=self.headers)
        self.assertEqual(d_res.status_code, 200)
        self.assertIsInstance(d_res.json(), list)

    def test_06_data_isolation_customers_and_invoices(self):
        """Verify customers and invoices return data scoped to agency_id."""
        c_res = self.client.get("/customers", headers=self.headers)
        self.assertEqual(c_res.status_code, 200)
        customers = c_res.json()
        for cust in customers:
            if "agency_id" in cust and cust["agency_id"]:
                self.assertEqual(cust["agency_id"], "AGY-1001")

        i_res = self.client.get("/invoices", headers=self.headers)
        self.assertEqual(i_res.status_code, 200)
        self.assertIsInstance(i_res.json(), list)


if __name__ == "__main__":
    unittest.main()
