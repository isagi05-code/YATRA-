-- ============================================================================
-- YATRA ERP - Enterprise Multi-Tenant Schema: Traveller Profiles
-- Target DB Engine: MySQL 8.x
-- ============================================================================

USE yatra_enterprise;

CREATE TABLE IF NOT EXISTS traveller_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  emergency_contact_name VARCHAR(255) NULL,
  emergency_contact_phone VARCHAR(50) NULL,
  preferences TEXT NULL,
  trips_count INT NOT NULL DEFAULT 0,
  expenses_count INT NOT NULL DEFAULT 0,
  bookings_count INT NOT NULL DEFAULT 0,
  feedback_rating DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  ai_usage_tokens INT NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_traveller_prof_user UNIQUE (user_id),
  CONSTRAINT fk_traveller_prof_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_traveller_rating (feedback_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
