-- ============================================================================
-- DEPRECATION NOTICE:
-- This flat 3-database schema file is DEPRECATED and maintained for legacy reference only.
-- The canonical schema of truth for YATRA is the modular SQL scripts located in:
--   backend/sql/00_auth_tables.sql through 16_master_seed_data.sql
-- ============================================================================
-- MySQL schema for the Yatra project (LEGACY).

CREATE DATABASE IF NOT EXISTS yatra_agency;
CREATE DATABASE IF NOT EXISTS yatra_traveller;
CREATE DATABASE IF NOT EXISTS yatra_team;

USE yatra_agency;

CREATE TABLE IF NOT EXISTS tours (
  trip_id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50),
  destination VARCHAR(255),
  customer VARCHAR(255),
  agency VARCHAR(255),
  start_date DATE,
  end_date DATE,
  status VARCHAR(100),
  vehicle VARCHAR(100),
  driver VARCHAR(255),
  passengers INT,
  guide VARCHAR(255),
  budget DECIMAL(12,2),
  current_lat DECIMAL(10,6),
  current_lng DECIMAL(10,6),
  timeline_status VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tour_stops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT,
  type VARCHAR(100),
  name VARCHAR(255),
  lat DECIMAL(10,6),
  lng DECIMAL(10,6),
  completed TINYINT(1) DEFAULT 0,
  CONSTRAINT fk_tour_stops_trip FOREIGN KEY (trip_id) REFERENCES tours(trip_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tour_timeline (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT,
  event_name VARCHAR(255),
  status VARCHAR(100),
  updated_at DATETIME,
  CONSTRAINT fk_tour_timeline_trip FOREIGN KEY (trip_id) REFERENCES tours(trip_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS expenses (
  expense_id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NULL,
  agency_id VARCHAR(50),
  amount DECIMAL(12,2),
  gst DECIMAL(12,2),
  vendor VARCHAR(255),
  category VARCHAR(100),
  `date` DATE,
  `time` TIME,
  description TEXT,
  payment_mode VARCHAR(100),
  approved_by VARCHAR(255),
  status VARCHAR(100),
  receipt_image VARCHAR(255),
  ocr_extracted_data TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicles (
  vehicle_number VARCHAR(50) PRIMARY KEY,
  agency_id VARCHAR(50),
  model VARCHAR(255),
  owner VARCHAR(255),
  insurance VARCHAR(255),
  permit VARCHAR(255),
  fitness VARCHAR(255),
  puc VARCHAR(255),
  fuel_type VARCHAR(100),
  mileage DECIMAL(10,2),
  current_location VARCHAR(255),
  availability VARCHAR(100),
  service_history TEXT,
  expenses DECIMAL(12,2),
  upcoming_maintenance VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS drivers (
  driver_id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50),
  name VARCHAR(255),
  license VARCHAR(100),
  aadhar VARCHAR(50),
  experience INT,
  trips_completed INT,
  assigned_tour VARCHAR(255),
  current_location VARCHAR(255),
  contact VARCHAR(50),
  emergency_contact VARCHAR(50),
  salary DECIMAL(12,2),
  expense DECIMAL(12,2),
  ratings DECIMAL(3,2),
  documents TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customers (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50),
  name VARCHAR(255),
  contact VARCHAR(50),
  email VARCHAR(255),
  booking_history TEXT,
  invoices TEXT,
  payments TEXT,
  upcoming_tours TEXT,
  documents TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50),
  type VARCHAR(100),
  title VARCHAR(255),
  message TEXT,
  `date` DATE,
  `read` TINYINT(1) DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` TEXT
) ENGINE=InnoDB;

USE yatra_traveller;

CREATE TABLE IF NOT EXISTS trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50),
  name VARCHAR(255),
  route TEXT,
  `date` DATE,
  duration VARCHAR(100),
  budget DECIMAL(12,2),
  status VARCHAR(100),
  driver VARCHAR(255),
  vehicle VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50),
  title VARCHAR(255),
  amount DECIMAL(12,2),
  `date` DATE,
  category VARCHAR(100),
  status VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50),
  trip_id INT,
  name VARCHAR(255),
  status VARCHAR(100),
  details TEXT,
  CONSTRAINT fk_bookings_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50),
  name VARCHAR(255),
  type VARCHAR(100),
  file_url VARCHAR(255),
  upload_date DATE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS profile (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  contact VARCHAR(50),
  preferences TEXT
) ENGINE=InnoDB;

USE yatra_team;

CREATE TABLE IF NOT EXISTS agencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  owner VARCHAR(255),
  contact VARCHAR(50),
  email VARCHAR(255),
  status VARCHAR(100),
  active_tours INT,
  revenue DECIMAL(14,2),
  expenses DECIMAL(14,2),
  drivers_count INT,
  vehicles_count INT,
  subscription_status VARCHAR(255),
  documents TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS travellers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  trips_count INT,
  expenses_count INT,
  bookings_count INT,
  feedback_rating DECIMAL(3,2),
  ai_usage_tokens INT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id INT,
  amount DECIMAL(12,2),
  `date` DATE,
  status VARCHAR(100),
  description TEXT,
  CONSTRAINT fk_team_payments_agency FOREIGN KEY (agency_id) REFERENCES agencies(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  cost DECIMAL(12,2),
  type VARCHAR(100),
  features TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id INT NULL,
  traveller_id INT NULL,
  subject VARCHAR(255),
  description TEXT,
  status VARCHAR(100),
  priority VARCHAR(50),
  `date` DATE,
  CONSTRAINT fk_support_ticket_agency FOREIGN KEY (agency_id) REFERENCES agencies(id),
  CONSTRAINT fk_support_ticket_traveller FOREIGN KEY (traveller_id) REFERENCES travellers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `timestamp` DATETIME,
  level VARCHAR(50),
  message TEXT
) ENGINE=InnoDB;

-- Schema inspection queries for DBeaver / MySQL

-- Show databases
SHOW DATABASES;

-- Show tables in a database
USE yatra_agency;
SHOW TABLES;

-- Show columns in one table
DESCRIBE tours;

-- Show all tables and columns in one database
SELECT
  TABLE_NAME,
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'yatra_agency'
ORDER BY TABLE_NAME, ORDINAL_POSITION;
