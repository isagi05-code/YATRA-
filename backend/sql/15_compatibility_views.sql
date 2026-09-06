-- ----------------------------------------------------------------------------
-- 1. YATRA ENTERPRISE UNIFIED COMPATIBILITY VIEWS
-- ----------------------------------------------------------------------------
USE yatra_enterprise;

CREATE OR REPLACE VIEW yatra_enterprise.trips AS
SELECT 
  trip_id AS id, user_id, destination AS name, destination AS route, 
  start_date AS `date`, CONCAT(DATEDIFF(end_date, start_date), ' Days') AS duration, 
  budget, status, driver, vehicle
FROM yatra_enterprise.tours
WHERE is_deleted = 0;

CREATE OR REPLACE VIEW yatra_enterprise.profile AS
SELECT 
  u.id, u.user_id, u.name, u.email, u.phone AS contact, tp.preferences
FROM yatra_enterprise.users u
LEFT JOIN yatra_enterprise.traveller_profiles tp ON u.user_id = tp.user_id
WHERE u.is_deleted = 0;

CREATE OR REPLACE VIEW yatra_enterprise.travellers AS
SELECT 
  u.id, u.user_id, u.name, u.email, 
  COALESCE(tp.trips_count, 0) AS trips_count, 
  COALESCE(tp.expenses_count, 0) AS expenses_count, 
  COALESCE(tp.bookings_count, 0) AS bookings_count, 
  COALESCE(tp.feedback_rating, 5.0) AS feedback_rating, 
  COALESCE(tp.ai_usage_tokens, 0) AS ai_usage_tokens
FROM yatra_enterprise.users u
LEFT JOIN yatra_enterprise.traveller_profiles tp ON u.user_id = tp.user_id
WHERE u.is_deleted = 0 AND (u.user_type = 'Traveller' OR tp.user_id IS NOT NULL);

CREATE OR REPLACE VIEW yatra_enterprise.logs AS
SELECT 
  id, `timestamp`, level, message
FROM yatra_enterprise.audit_logs;

CREATE OR REPLACE VIEW yatra_enterprise.settings AS
SELECT 
  `key`, `value`
FROM yatra_enterprise.agency_settings
WHERE is_deleted = 0;

