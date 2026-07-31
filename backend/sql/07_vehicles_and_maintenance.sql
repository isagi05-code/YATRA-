-- ============================================================================
-- YATRA ERP - Enterprise Multi-Tenant Schema: Fleet Vehicles & Maintenance
-- Target DB Engine: MySQL 8.x
-- ============================================================================

USE yatra_enterprise;

CREATE TABLE IF NOT EXISTS vehicles (
  vehicle_number VARCHAR(50) NOT NULL PRIMARY KEY,
  agency_id VARCHAR(50) NOT NULL,
  model VARCHAR(255) NOT NULL,
  owner VARCHAR(255) NOT NULL,
  insurance VARCHAR(255) NULL,
  insurance_expiry DATE NULL,
  permit VARCHAR(255) NULL,
  permit_expiry DATE NULL,
  fitness_expiry DATE NULL,
  puc_expiry DATE NULL,
  fuel_type ENUM('Diesel', 'Petrol', 'CNG', 'Electric', 'Hybrid') NOT NULL DEFAULT 'Diesel',
  mileage DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  current_location VARCHAR(255) NULL,
  availability ENUM('Available', 'Assigned', 'In Maintenance', 'Out of Service') NOT NULL DEFAULT 'Available',
  expenses DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  upcoming_maintenance VARCHAR(255) NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehicles_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_vehicles_agency_avail (agency_id, availability),
  INDEX idx_vehicles_insurance (insurance_expiry),
  INDEX idx_vehicles_permit (permit_expiry)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  service_type VARCHAR(255) NOT NULL,
  service_date DATE NOT NULL,
  cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  mechanic_vendor VARCHAR(255) NULL,
  odometer_reading INT NULL,
  notes TEXT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vm_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_vm_vehicle FOREIGN KEY (vehicle_number) REFERENCES vehicles(vehicle_number) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_vm_agency_vehicle (agency_id, vehicle_number, service_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
