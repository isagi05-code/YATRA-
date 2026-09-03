"""
Stage 2 Unit Tests: Authentication, Security Hardening, JWT, OTP Lifecycle & Cryptography.
"""
import unittest
import sys
import os
from datetime import timedelta
from fastapi.testclient import TestClient

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_and_save_otp,
    verify_and_consume_otp
)
from auth_api import app as auth_app
from agency_api import app as agency_app


class TestStage2AuthSecurity(unittest.TestCase):
    def setUp(self):
        self.auth_client = TestClient(auth_app)
        self.agency_client = TestClient(agency_app)

    def test_01_password_hashing_and_verification(self):
        """Test bcrypt password hashing and verification."""
        password = "SecurePassword@2026!"
        hashed = hash_password(password)
        self.assertNotEqual(password, hashed)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("WrongPassword123", hashed))

    def test_02_jwt_token_generation_and_decoding(self):
        """Test JWT token encoding and payload claims decoding."""
        payload_data = {
            "user_id": "USR-TEST-001",
            "email": "test@yatra.com",
            "agency_id": "AGY-1001",
            "role": "Agency Owner",
            "portal": "agency",
            "permissions": ["all"]
        }
        token = create_access_token(payload_data, expires_delta=timedelta(minutes=30))
        self.assertIsInstance(token, str)
        self.assertTrue(len(token) > 20)

        decoded = decode_access_token(token)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded.get("user_id"), "USR-TEST-001")
        self.assertEqual(decoded.get("agency_id"), "AGY-1001")
        self.assertEqual(decoded.get("role"), "Agency Owner")

    def test_03_otp_lifecycle_and_single_use(self):
        """Test OTP generation, valid verification, and consumption (single-use)."""
        test_identifier = "unit_test_otp_user@example.com"
        otp_code = generate_and_save_otp(test_identifier, portal="agency", mode="register")
        self.assertEqual(len(otp_code), 6)
        self.assertTrue(otp_code.isdigit())

        # First verification must succeed
        valid = verify_and_consume_otp(test_identifier, otp_code)
        self.assertTrue(valid, "First OTP verification should succeed")

        # Second verification of the exact same OTP must fail (consumed)
        second_attempt = verify_and_consume_otp(test_identifier, otp_code)
        self.assertFalse(second_attempt, "Reusing consumed OTP must be rejected")

    def test_04_security_otp_not_leaked_in_api_response(self):
        """Security: Verify /auth/send-otp does not return plaintext 'otp' in response payload."""
        response = self.auth_client.post("/auth/send-otp", json={
            "identifier": "security_test_user@example.com",
            "mode": "register",
            "portal": "agency"
        })
        # If user already registered or newly created, response JSON must not contain 'otp'
        data = response.json()
        self.assertNotIn("otp", data, "CRITICAL: Plaintext OTP code must NOT be leaked in API response")

    def test_05_security_unauthenticated_request_rejected(self):
        """Security: Verify get_current_user dependency rejects unauthenticated requests with 401."""
        from auth_deps import get_current_user
        from starlette.requests import Request
        import asyncio

        # Create mock request without Authorization header
        scope = {
            "type": "http",
            "headers": [],
            "query_string": b"agency_id=AGY-1001",
        }
        req = Request(scope)

        with self.assertRaises(Exception) as ctx:
            asyncio.run(get_current_user(req, None))
        
        self.assertEqual(ctx.exception.status_code, 401)

    def test_06_security_set_password_requires_otp(self):
        """Security: Verify /auth/set-password rejects requests missing an OTP."""
        response = self.auth_client.post("/auth/set-password", json={
            "identifier": "agency.owner@yatrademo.com",
            "portal": "agency",
            "password": "NewSecretPassword123!",
            "confirm_password": "NewSecretPassword123!",
            "otp": ""
        })
        self.assertEqual(
            response.status_code,
            400,
            "Password reset without valid OTP must be rejected with 400 Bad Request"
        )

    def test_07_security_portal_and_mode_input_validation(self):
        """Security: Verify send-otp rejects invalid/malicious portal or mode parameters."""
        # Invalid portal
        resp1 = self.auth_client.post("/auth/send-otp", json={
            "identifier": "user@example.com",
            "portal": "superadmin_hacked",
            "mode": "register"
        })
        self.assertEqual(resp1.status_code, 400)

        # Invalid mode
        resp2 = self.auth_client.post("/auth/send-otp", json={
            "identifier": "user@example.com",
            "portal": "agency",
            "mode": "delete_account"
        })
        self.assertEqual(resp2.status_code, 400)


if __name__ == "__main__":
    unittest.main()
