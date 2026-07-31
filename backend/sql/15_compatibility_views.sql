-- ============================================================================
-- YATRA ERP - Enterprise Database Backward-Compatibility Layer (MySQL Views)
-- Target DB Engine: MySQL 8.x
-- Purpose: Allows agency_api.py, traveller_api.py, and team_api.py to execute
--          without modifying existing SQL queries or frontend APIs.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Create Virtual Schemas
-- ----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS yatra_agency DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS yatra_traveller DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS yatra_team DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. YATRA AGENCY COMPATIBILITY VIEWS
-- ----------------------------------------------------------------------------
USE yatra_agency;

CREATE OR REPLACE VIEW yatra_agency.tours AS
SELECT 
  trip_id, agency_id, destination, customer, agency, 
  start_date, end_date, status, vehicle, driver, 
  passengers, guide, budget, current_lat, current_lng, timeline_status
FROM yatra_enterprise.tours
WHERE is_deleted = 0;

CREATE OR REPLACE VIEW yatra_agency.tour_stops AS
SELECT 
  id, trip_id, type, name, lat, lng, completed
FROM yatra_enterprise.tour_stops
WHERE is_deleted = 0;

CREATE OR REPLACE VIEW yatra_agency.tour_timeline AS
SELECT 
  id, trip_id, event_name, status, updated_at
FROM yatra_enterprise.tour_timeline
WHERE is_deleted = 0;

CREATE OR REPLACE VIEW yatra_agency.expenses AS
SELECT 
  expense_id, trip_id, agency_id, amount, gst, vendor, 
  category, `date`, `time`, description, payment_mode, approved_by, 
  status, receipt_image,
  (SELECT structured_json FROM yatra_enterprise.ocr_results o WHERE o.expense_id = e.expense_id LIMIT 1) AS ocr_extracted_data
FROM yatra_enterprise.expenses e
WHERE is_deleted = 0;

CREATE OR REPLACE VIEW yatra_agency.vehicles AS
SELECT 
  vehicle_number, agency_id, model, owner, insurance, permit, 
  fitness_expiry AS fitness, puc_expiry AS puc, fuel_type, mileage, 
  current_location, availability, 
  (SELECT JSON_ARRAYAGG(JSON_OBJECT('date', service_date, 'type', service_type, 'cost', cost))
   FROM yatra_enterprise.vehicle_maintenance vm WHERE vm.vehicle_number = v.vehicle_number AND vm.is_deleted = 0) AS service_history,
  expenses, upcoming_maintenance
FROM yatra_enterprise.vehicles v
WHERE is_deleted = 0;

CREATE OR REPLACE VIEW yatra_agency.drivers AS
SELECT 
  driver_id, agency_id, name, license, aadhar, experience, 
  trips_completed, assigned_tour, current_location, contact, 
  emergency_contact, salary, expense, ratings, documents
FROM yatra_enterprise.drivers
WHERE is_deleted = 0;

CREATE OR REPLACE VIEW yatra_agency.customers AS
SELECT 
  customer_id, agency_id, name, contact, email, 
  booking_history, invoices, payments, upcoming_tours, documents
FROM yatra_enterprise.customers
WHERE is_deleted = 0;

CREATE OR REPLACE VIEW yatra_agency.notifications AS
SELECT 
  id, agency_id, type, title, message, `date`, `read`
FROM yatra_enterprise.notifications
WHERE is_deleted = 0;

CREATE OR REPLACE VIEW yatra_agency.settings AS
SELECT 
  `key`, `value`
FROM yatra_enterprise.agency_settings
WHERE is_deleted = 0;

-- ----------------------------------------------------------------------------
-- 3. YATRA TRAVELLER COMPATIBILITY VIEWS
-- ----------------------------------------------------------------------------
USE yatra_traveller;

CREATE OR REPLACE VIEW yatra_traveller.trips AS
SELECT 
  trip_id AS id, user_id, destination AS name, destination AS route, 
  start_date AS `date`, CONCAT(DATEDIFF(end_date, start_date), ' Days') AS duration, 
  budget, status, driver, vehicle
FROM yatra_enterprise.tours
WHERE is_deleted = 0 AND user_id IS NOT NULL;

CREATE OR REPLACE VIEW yatra_traveller.expenses AS
SELECT 
  expense_id AS id, user_id, title, amount, `date`, category, status
FROM yatra_enterprise.expenses
WHERE is_deleted = 0 AND user_id IS NOT NULL;

CREATE OR REPLACE VIEW yatra_traveller.bookings AS
SELECT 
  id, user_id, trip_id, name, status, details
FROM yatra_enterprise.bookings
WHERE is_deleted = 0 AND user_id IS NOT NULL;

CREATE OR REPLACE VIEW yatra_traveller.documents AS
SELECT 
  id, user_id, name, type, file_url, upload_date
FROM yatra_enterprise.documents
WHERE is_deleted = 0 AND user_id IS NOT NULL;

CREATE OR REPLACE VIEW yatra_traveller.profile AS
SELECT 
  u.id, u.user_id, u.name, u.email, u.phone AS contact, tp.preferences
FROM yatra_enterprise.users u
LEFT JOIN yatra_enterprise.traveller_profiles tp ON u.user_id = tp.user_id
WHERE u.is_deleted = 0 AND (u.user_type = 'Traveller' OR tp.user_id IS NOT NULL);

-- ----------------------------------------------------------------------------
-- 4. YATRA TEAM COMPATIBILITY VIEWS
-- ----------------------------------------------------------------------------
USE yatra_team;

CREATE OR REPLACE VIEW yatra_team.agencies AS
SELECT 
  id, agency_id, name, owner_name AS owner, contact, email, 
  status, active_tours, revenue, expenses, drivers_count, vehicles_count, 
  subscription_status, NULL AS documents
FROM yatra_enterprise.agencies
WHERE is_deleted = 0;

CREATE OR REPLACE VIEW yatra_team.travellers AS
SELECT 
  u.id, u.user_id, u.name, u.email, 
  tp.trips_count, tp.expenses_count, tp.bookings_count, tp.feedback_rating, tp.ai_usage_tokens
FROM yatra_enterprise.users u
LEFT JOIN yatra_enterprise.traveller_profiles tp ON u.user_id = tp.user_id
WHERE u.is_deleted = 0 AND (u.user_type = 'Traveller' OR tp.user_id IS NOT NULL);

CREATE OR REPLACE VIEW yatra_team.payments AS
SELECT 
  payment_id AS id, agency_id, amount, `date`, status, description
FROM yatra_enterprise.payments
WHERE is_deleted = 0;

CREATE OR REPLACE VIEW yatra_team.subscriptions AS
SELECT 
  id, name, cost, type, features
FROM yatra_enterprise.subscriptions
WHERE is_active = 1;

CREATE OR REPLACE VIEW yatra_team.support_tickets AS
SELECT 
  id, agency_id, traveller_id, subject, description, status, priority, `date`
FROM yatra_enterprise.support_tickets
WHERE is_deleted = 0;

CREATE OR REPLACE VIEW yatra_team.logs AS
SELECT 
  id, `timestamp`, level, message
FROM yatra_enterprise.audit_logs;
