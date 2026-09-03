# Stage 3 Unit Test Report: Agency Domain & Multi-Tenant Data Isolation

> **Test Suite:** `tests/test_stage3_agency.py`  
> **Target Module:** `backend/agency_api.py`, `backend/routers/agency_dashboard.py`, `backend/routers/agency_tours.py`, `backend/routers/agency_expenses.py`, `backend/routers/agency_fleet.py`, `backend/routers/agency_misc.py`  
> **Execution Date:** 2026-08-27  
> **Result:** ✅ **6 / 6 PASSED** (Execution Time: 1.193s)

---

## 📋 Objectives & Scope

Stage 3 validates the Agency Microservice (Port 8000) and its multi-tenant domain features:
1. **Dashboard Metrics:** KPI cards (`total_revenue`, `total_expenses`, `active_tours`, `total_vehicles`, `total_drivers`).
2. **Dashboard Graphs:** Monthly financial trends and revenue distribution.
3. **Tours Lifecycle:** Tour listings, filters, assignments, and timeline status tracking.
4. **Expense Management:** Expense listings, OCR data bindings, category allocations, and approval statuses.
5. **Fleet & Driver Operations:** Vehicles inventory, maintenance history, drivers, licenses, and ratings.
6. **Multi-Tenant Data Isolation:** Verifying that customer CRM records, invoices, and settings strictly return data scoped to the authenticated agency (`agency_id`).

---

## 🧪 Test Execution Matrix

| Test ID | Test Method | Objective | Result | Duration |
|---------|-------------|-----------|--------|----------|
| **AGY-01** | `test_01_agency_dashboard_summary` | Validate summary stats payload and metrics computation | ✅ PASS | 0.298s |
| **AGY-02** | `test_02_agency_dashboard_graphs` | Validate chart series and monthly revenue arrays | ✅ PASS | 0.178s |
| **AGY-03** | `test_03_agency_tours_list` | Validate agency tour items and vehicle/driver associations | ✅ PASS | 0.180s |
| **AGY-04** | `test_04_agency_expenses_list` | Validate expense tracking and approval states | ✅ PASS | 0.179s |
| **AGY-05** | `test_05_agency_fleet_vehicles_and_drivers` | Validate fleet inventory and driver assignments | ✅ PASS | 0.180s |
| **AGY-06** | `test_06_data_isolation_customers_and_invoices` | Strict verification that queries return only records for `AGY-1001` | ✅ PASS | 0.178s |

---

## 🔍 Detailed Test Analysis

### 1. Dashboard Summary KPIs
- **Endpoint:** `GET /dashboard/summary`
- **Headers:** `Authorization: Bearer <valid_jwt>`
- **Response Structure:**
  ```json
  {
    "stats": {
      "total_revenue": 36000.0,
      "total_expenses": 29900.0,
      "profit": 6100.0,
      "active_tours": 2,
      "completed_tours": 2,
      "total_vehicles": 3,
      "total_drivers": 3,
      "upcoming_tours": 2
    },
    "recent_notifications": [ ... ]
  }
  ```
- **Verdict:** Accurate aggregation across tours, fleet, and expenses.

### 2. Multi-Tenant Scoping & Customer CRM
- **Endpoint:** `GET /customers`
- **Verification:**
  - Evaluated all customer rows returned.
  - Confirmed that every customer row has `agency_id == 'AGY-1001'`.
  - Customers belonging to other agencies are completely filtered out.

### 3. Invoices & Billing
- **Endpoint:** `GET /invoices`
- **Verification:** Completed tours for the agency are properly formatted as invoice summary items with tour details, amounts, and payment statuses.

### 4. Fleet & Drivers
- **Endpoints:** `GET /vehicles`, `GET /drivers`
- **Verification:** Successfully retrieved vehicle numbers (`MH-01-DK-4507`, etc.) and driver profiles with ratings and assignment metadata.

---

## 📊 Summary Verdict

```
Stage 3: Agency Domain & Multi-Tenant Data Isolation — ALL 6 TESTS PASSED
Status: VERIFIED & ISOLATED
```
