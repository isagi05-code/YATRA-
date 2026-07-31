-- ============================================================================
-- YATRA ERP - Enterprise Multi-Tenant Schema: Agencies
-- Target DB Engine: MySQL 8.x
-- ============================================================================

USE yatra_enterprise;

CREATE TABLE IF NOT EXISTS agencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  contact VARCHAR(50) NOT NULL,
  status ENUM('Active', 'Pending Verification', 'Suspended', 'Inactive') NOT NULL DEFAULT 'Pending Verification',
  active_tours INT NOT NULL DEFAULT 0,
  revenue DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  expenses DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  drivers_count INT NOT NULL DEFAULT 0,
  vehicles_count INT NOT NULL DEFAULT 0,
  subscription_status VARCHAR(100) NOT NULL DEFAULT 'Trial',
  logo_url VARCHAR(500) NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_agencies_agency_id UNIQUE (agency_id),
  CONSTRAINT uq_agencies_email UNIQUE (email),
  INDEX idx_agencies_status (status),
  INDEX idx_agencies_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
