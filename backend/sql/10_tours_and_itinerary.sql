-- ============================================================================
-- YATRA ERP - Enterprise Multi-Tenant Schema: Tours & Itinerary Stops
-- Target DB Engine: MySQL 8.x
-- ============================================================================

USE yatra_enterprise;

CREATE TABLE IF NOT EXISTS tours (
  trip_id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  customer VARCHAR(255) NULL,
  customer_id INT NULL,
  agency VARCHAR(255) NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(100) NOT NULL DEFAULT 'Upcoming',
  vehicle VARCHAR(100) NULL,
  driver VARCHAR(255) NULL,
  driver_id INT NULL,
  passengers INT NOT NULL DEFAULT 1,
  guide VARCHAR(255) NULL,
  budget DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  current_lat DECIMAL(10,6) NULL,
  current_lng DECIMAL(10,6) NULL,
  timeline_status VARCHAR(255) NULL DEFAULT 'Draft',
  user_id VARCHAR(50) NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tours_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tours_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_tours_driver FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_tours_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_tours_agency_status (agency_id, status, start_date),
  INDEX idx_tours_dates (start_date, end_date),
  INDEX idx_tours_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tour_stops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NOT NULL,
  trip_id INT NOT NULL,
  type VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  lat DECIMAL(10,6) NOT NULL,
  lng DECIMAL(10,6) NOT NULL,
  completed TINYINT(1) NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tour_stops_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tour_stops_trip FOREIGN KEY (trip_id) REFERENCES tours(trip_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_stops_agency_trip (agency_id, trip_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tour_timeline (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NOT NULL,
  trip_id INT NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  status VARCHAR(100) NOT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tour_timeline_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tour_timeline_trip FOREIGN KEY (trip_id) REFERENCES tours(trip_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_timeline_agency_trip (agency_id, trip_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
