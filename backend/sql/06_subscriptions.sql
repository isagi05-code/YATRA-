-- ============================================================================
-- YATRA ERP - Enterprise Multi-Tenant Schema: Subscriptions
-- Target DB Engine: MySQL 8.x
-- ============================================================================

USE yatra_enterprise;

CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  type VARCHAR(100) NOT NULL DEFAULT 'Monthly',
  billing_cycle ENUM('Monthly', 'Annual') NOT NULL DEFAULT 'Monthly',
  max_vehicles INT NOT NULL DEFAULT 10,
  max_drivers INT NOT NULL DEFAULT 10,
  features TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_subscriptions_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agency_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NOT NULL,
  subscription_id INT NOT NULL,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status ENUM('Active', 'Expired', 'Grace Period', 'Cancelled') NOT NULL DEFAULT 'Active',
  auto_renew TINYINT(1) NOT NULL DEFAULT 1,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_as_agency_sub UNIQUE (agency_id, subscription_id),
  CONSTRAINT fk_as_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_as_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_as_agency_status (agency_id, status),
  INDEX idx_as_expiry (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
