-- ============================================================================
-- YATRA ERP - Enterprise Multi-Tenant Schema: Bookings, Invoices & Payments
-- Target DB Engine: MySQL 8.x
-- ============================================================================

USE yatra_enterprise;

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NULL,
  user_id VARCHAR(50) NULL,
  trip_id INT NULL,
  customer_id INT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(100) NOT NULL DEFAULT 'Confirmed',
  details TEXT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bk_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_bk_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_bk_trip FOREIGN KEY (trip_id) REFERENCES tours(trip_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_bk_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_bk_agency_trip (agency_id, trip_id),
  INDEX idx_bk_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoices (
  invoice_id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NOT NULL,
  invoice_number VARCHAR(100) NOT NULL,
  trip_id INT NULL,
  customer_id INT NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status ENUM('Draft', 'Issued', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled') NOT NULL DEFAULT 'Issued',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  pdf_url VARCHAR(500) NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_invoices_agency_num UNIQUE (agency_id, invoice_number),
  CONSTRAINT fk_inv_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_inv_trip FOREIGN KEY (trip_id) REFERENCES tours(trip_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_inv_cust FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_inv_agency_cust (agency_id, customer_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id INT NULL,
  agency_code VARCHAR(50) NULL,
  invoice_id INT NULL,
  customer_id INT NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `date` DATE NULL,
  status VARCHAR(100) NOT NULL DEFAULT 'Completed',
  description TEXT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pay_agency FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_pay_agency_code FOREIGN KEY (agency_code) REFERENCES agencies(agency_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_pay_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_pay_cust FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_pay_agency_date (agency_code, `date`),
  INDEX idx_pay_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
