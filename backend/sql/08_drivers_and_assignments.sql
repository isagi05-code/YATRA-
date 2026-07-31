-- ============================================================================
-- YATRA ERP - Enterprise Multi-Tenant Schema: Drivers & Driver Assignments
-- Target DB Engine: MySQL 8.x
-- ============================================================================

USE yatra_enterprise;

CREATE TABLE IF NOT EXISTS drivers (
  driver_id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NULL,
  name VARCHAR(255) NOT NULL,
  license VARCHAR(100) NOT NULL,
  aadhar VARCHAR(50) NULL,
  experience INT NOT NULL DEFAULT 0,
  trips_completed INT NOT NULL DEFAULT 0,
  assigned_tour VARCHAR(255) NULL DEFAULT 'None',
  current_location VARCHAR(255) NULL,
  contact VARCHAR(50) NOT NULL,
  emergency_contact VARCHAR(50) NULL,
  salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  expense DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ratings DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  documents TEXT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_drivers_agency_license UNIQUE (agency_id, license),
  CONSTRAINT fk_drivers_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_drivers_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_drivers_agency_name (agency_id, name),
  INDEX idx_drivers_contact (contact)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS driver_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NOT NULL,
  driver_id INT NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  trip_id INT NULL,
  assigned_start DATETIME NOT NULL,
  assigned_end DATETIME NULL,
  status ENUM('Active', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Active',
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_da_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_da_driver FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_da_vehicle FOREIGN KEY (vehicle_number) REFERENCES vehicles(vehicle_number) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_da_agency_driver (agency_id, driver_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
