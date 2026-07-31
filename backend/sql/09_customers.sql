-- ============================================================================
-- YATRA ERP - Enterprise Multi-Tenant Schema: Customers
-- Target DB Engine: MySQL 8.x
-- ============================================================================

USE yatra_enterprise;

CREATE TABLE IF NOT EXISTS customers (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NULL,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(50) NOT NULL,
  email VARCHAR(255) NULL,
  booking_history TEXT NULL,
  invoices TEXT NULL,
  payments TEXT NULL,
  upcoming_tours TEXT NULL,
  documents TEXT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_customers_agency_email UNIQUE (agency_id, email),
  CONSTRAINT fk_cust_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cust_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_cust_agency_name (agency_id, name),
  INDEX idx_cust_contact (contact)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
