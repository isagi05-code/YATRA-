-- ============================================================================
-- YATRA ERP - Enterprise Multi-Tenant Schema: Expense Management & OCR Audit
-- Target DB Engine: MySQL 8.x
-- ============================================================================

USE yatra_enterprise;

CREATE TABLE IF NOT EXISTS expense_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_exp_cat_agency_name UNIQUE (agency_id, name),
  CONSTRAINT fk_ec_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS expenses (
  expense_id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NULL,
  agency_id VARCHAR(50) NULL,
  user_id VARCHAR(50) NULL,
  category_id INT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  gst DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  vendor VARCHAR(255) NULL,
  category VARCHAR(100) NULL,
  `date` DATE NULL,
  `time` TIME NULL,
  description TEXT NULL,
  payment_mode VARCHAR(100) NULL,
  approved_by VARCHAR(255) NULL,
  status VARCHAR(100) NOT NULL DEFAULT 'Approved',
  receipt_image VARCHAR(255) NULL,
  title VARCHAR(255) NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_expenses_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_expenses_trip FOREIGN KEY (trip_id) REFERENCES tours(trip_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_expenses_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_expenses_category FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_exp_agency_trip (agency_id, trip_id, `date`),
  INDEX idx_exp_user (user_id, `date`),
  INDEX idx_exp_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS expense_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NULL,
  expense_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size_bytes INT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ea_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ea_expense FOREIGN KEY (expense_id) REFERENCES expenses(expense_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_ea_expense (expense_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ocr_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NULL,
  expense_id INT NOT NULL,
  raw_text TEXT NULL,
  extracted_vendor VARCHAR(255) NULL,
  extracted_total DECIMAL(12,2) NULL,
  extracted_tax DECIMAL(12,2) NULL,
  extracted_date DATE NULL,
  confidence_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  structured_json JSON NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_ocr_expense UNIQUE (expense_id),
  CONSTRAINT fk_ocr_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ocr_expense FOREIGN KEY (expense_id) REFERENCES expenses(expense_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
