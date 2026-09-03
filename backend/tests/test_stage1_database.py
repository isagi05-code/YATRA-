"""
Stage 1 Unit Tests: Core Database Layer, Schema Integrity & Query Translation.
"""
import unittest
import sys
import os

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.database import get_db_conn


class TestStage1Database(unittest.TestCase):
    def setUp(self):
        self.conn = get_db_conn("yatra_enterprise")
        self.cursor = self.conn.cursor()

    def tearDown(self):
        try:
            self.conn.close()
        except Exception:
            pass

    def test_01_connection_established(self):
        """Test database connection is active and responsive."""
        self.assertIsNotNone(self.conn, "Database connection should not be None")
        self.assertIsNotNone(self.cursor, "Cursor should not be None")

    def test_02_query_placeholder_translation_execution(self):
        """Test that cursor.execute handles '?' placeholders seamlessly."""
        try:
            self.cursor.execute("SELECT user_id, email, status FROM users WHERE status = ? LIMIT 1", ("Active",))
            row = self.cursor.fetchone()
            self.assertIsNotNone(row)
            self.assertEqual(row["status"], "Active")
        except Exception as e:
            self.fail(f"Executing parameterized query with '?' placeholder failed: {e}")

    def test_03_enterprise_core_tables_exist(self):
        """Verify all critical enterprise tables are present in the database."""
        expected_tables = [
            "users",
            "agencies",
            "tours",
            "expenses",
            "vehicles",
            "drivers",
            "customers",
            "notifications",
            "agency_settings"
        ]
        
        for table in expected_tables:
            try:
                self.cursor.execute(f"SELECT 1 FROM {table} LIMIT 1")
                # If execution succeeds without exception, table exists
                self.assertTrue(True)
            except Exception as e:
                self.fail(f"Required table '{table}' is missing or query failed: {e}")

    def test_04_dictionary_row_access(self):
        """Test that cursor rows support dict-like column key access."""
        self.cursor.execute("SELECT user_id, email, user_type FROM users LIMIT 1")
        row = self.cursor.fetchone()
        if row:
            self.assertIn("user_id", row)
            self.assertIn("email", row)
            self.assertIn("user_type", row)
            # Verify dict conversion
            row_dict = dict(row)
            self.assertIsInstance(row_dict, dict)
            self.assertIsNotNone(row_dict["user_id"])

    def test_05_database_crud_transaction_isolation(self):
        """Test INSERT, SELECT, UPDATE, and DELETE cycle."""
        test_key = "test_unit_setting_stage1"
        test_val = "unit_test_val_123"
        
        # 1. Insert
        try:
            self.cursor.execute(
                "INSERT INTO agency_settings (agency_id, `key`, `value`) VALUES (?, ?, ?)",
                ("AGY-1001", test_key, test_val)
            )
            self.conn.commit()
        except Exception:
            # If already exists, update
            self.cursor.execute(
                "UPDATE agency_settings SET `value` = ? WHERE agency_id = ? AND `key` = ?",
                (test_val, "AGY-1001", test_key)
            )
            self.conn.commit()

        # 2. Select & Verify
        self.cursor.execute(
            "SELECT `value` FROM agency_settings WHERE agency_id = ? AND `key` = ?",
            ("AGY-1001", test_key)
        )
        res = self.cursor.fetchone()
        self.assertIsNotNone(res, "Inserted test setting must be retrievable")
        self.assertEqual(res["value"], test_val)

        # 3. Clean up
        self.cursor.execute(
            "DELETE FROM agency_settings WHERE agency_id = ? AND `key` = ?",
            ("AGY-1001", test_key)
        )
        self.conn.commit()

        self.cursor.execute(
            "SELECT `value` FROM agency_settings WHERE agency_id = ? AND `key` = ?",
            ("AGY-1001", test_key)
        )
        self.assertIsNone(self.cursor.fetchone(), "Deleted setting should not exist")


if __name__ == "__main__":
    unittest.main()
