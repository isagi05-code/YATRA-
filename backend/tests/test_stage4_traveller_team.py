"""
Stage 4 Unit Tests: Traveller & Team Admin Microservices Endpoints.
"""
import unittest
import sys
import os
from fastapi.testclient import TestClient

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from traveller_api import app as traveller_app
from team_api import app as team_app
from auth_utils import create_access_token


class TestStage4TravellerTeam(unittest.TestCase):
    def setUp(self):
        self.traveller_client = TestClient(traveller_app)
        self.team_client = TestClient(team_app)

        # Traveller JWT Token
        self.traveller_token = create_access_token({
            "user_id": "USR-TRV-1001",
            "email": "yugal.kishor@example.com",
            "role": "Traveller",
            "portal": "traveller",
            "permissions": ["traveller:read", "traveller:write"]
        })
        self.traveller_headers = {"Authorization": f"Bearer {self.traveller_token}"}

        # Team Admin JWT Token
        self.team_token = create_access_token({
            "user_id": "USR-ADM-1001",
            "email": "superadmin@yatra.com",
            "role": "Super Admin",
            "portal": "team",
            "permissions": ["*"]
        })
        self.team_headers = {"Authorization": f"Bearer {self.team_token}"}

    def test_01_traveller_dashboard_summary(self):
        """Test Traveller GET /dashboard/summary."""
        res = self.traveller_client.get("/dashboard/summary", headers=self.traveller_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("trips_count", data)
        self.assertIn("total_spent", data)
        self.assertIn("monthly_budget", data)

    def test_02_traveller_trips_and_expenses(self):
        """Test Traveller GET /trips and GET /expenses."""
        t_res = self.traveller_client.get("/trips", headers=self.traveller_headers)
        self.assertEqual(t_res.status_code, 200)
        self.assertIsInstance(t_res.json(), list)

        e_res = self.traveller_client.get("/expenses", headers=self.traveller_headers)
        self.assertEqual(e_res.status_code, 200)
        self.assertIsInstance(e_res.json(), list)

    def test_03_team_admin_dashboard_summary(self):
        """Test Team Admin GET /dashboard/summary."""
        res = self.team_client.get("/dashboard/summary", headers=self.team_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("total_agencies", data)
        self.assertIn("active_agencies", data)
        self.assertIn("total_revenue_cr", data)
        self.assertIn("platform_commission", data)

    def test_04_team_admin_agencies_and_travellers_list(self):
        """Test Team Admin GET /agencies and GET /travellers."""
        ag_res = self.team_client.get("/agencies", headers=self.team_headers)
        self.assertEqual(ag_res.status_code, 200)
        self.assertIsInstance(ag_res.json(), list)

        tr_res = self.team_client.get("/travellers", headers=self.team_headers)
        self.assertEqual(tr_res.status_code, 200)
        self.assertIsInstance(tr_res.json(), list)

    def test_05_team_admin_health_and_ai_usage(self):
        """Test Team Admin GET /health and GET /ai-usage."""
        h_res = self.team_client.get("/health", headers=self.team_headers)
        self.assertEqual(h_res.status_code, 200)
        self.assertIn("status", h_res.json())

        ai_res = self.team_client.get("/ai-usage", headers=self.team_headers)
        self.assertEqual(ai_res.status_code, 200)


if __name__ == "__main__":
    unittest.main()
