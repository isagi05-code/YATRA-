"""
Master Unit Test Runner for Yatra Platform Backend.
Executes all test stages and reports individual and aggregate results.
"""
import unittest
import sys
import os
import time

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tests.test_stage1_database import TestStage1Database
from tests.test_stage2_auth_security import TestStage2AuthSecurity
from tests.test_stage3_agency import TestStage3Agency
from tests.test_stage4_traveller_team import TestStage4TravellerTeam


def run_stage(test_case_class, stage_name):
    print(f"\n=======================================================")
    print(f"   RUNNING: {stage_name}")
    print(f"=======================================================")
    suite = unittest.TestLoader().loadTestsFromTestCase(test_case_class)
    start_time = time.time()
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    elapsed = time.time() - start_time
    
    stage_summary = {
        "name": stage_name,
        "total": result.testsRun,
        "passed": result.testsRun - len(result.failures) - len(result.errors),
        "failed": len(result.failures),
        "errors": len(result.errors),
        "elapsed_sec": round(elapsed, 3),
        "success": result.wasSuccessful()
    }
    return stage_summary


def main():
    print("\n=======================================================")
    print("      YATRA BACKEND ENTERPRISE UNIT TEST SUITE         ")
    print("=======================================================")
    
    stages = [
        (TestStage1Database, "Stage 1: Database Layer & Schema Integrity"),
        (TestStage2AuthSecurity, "Stage 2: Auth, Security & OTP Lifecycle"),
        (TestStage3Agency, "Stage 3: Agency Domain & Multi-Tenant Data Isolation"),
        (TestStage4TravellerTeam, "Stage 4: Traveller & Team Admin Microservices")
    ]
    
    results = []
    total_start = time.time()
    
    for test_class, name in stages:
        summary = run_stage(test_class, name)
        results.append(summary)
        
    total_elapsed = time.time() - total_start
    
    print("\n\n=======================================================")
    print("                 FINAL TEST MATRIX SUMMARY             ")
    print("=======================================================")
    print(f"{'Stage Name':<50} | {'Tests':<6} | {'Passed':<6} | {'Status':<8} | {'Time (s)':<8}")
    print("-" * 88)
    
    all_passed = True
    total_tests = 0
    total_passed = 0
    
    for r in results:
        status_str = "PASSED" if r["success"] else "FAILED"
        if not r["success"]:
            all_passed = False
        total_tests += r["total"]
        total_passed += r["passed"]
        print(f"{r['name']:<50} | {r['total']:<6} | {r['passed']:<6} | {status_str:<8} | {r['elapsed_sec']:<8}")
        
    print("-" * 88)
    print(f"{'TOTAL / AGGREGATE':<50} | {total_tests:<6} | {total_passed:<6} | {'ALL PASS' if all_passed else 'FAIL':<8} | {round(total_elapsed, 3):<8}")
    print("=======================================================\n")
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
