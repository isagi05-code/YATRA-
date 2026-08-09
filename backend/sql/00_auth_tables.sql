-- ============================================================================
-- YATRA ERP - Auth, Sessions & Multi-Tenant Auth Tables
-- Run FIRST (00) so all other tables can reference users.user_id
-- Only creates tables NOT already in 03_users.sql / 04_traveller_profiles.sql
-- ============================================================================

CREATE DATABASE IF NOT EXISTS yatra_enterprise;
USE yatra_enterprise;

-- 1. Master Centralized Users Table
--    Includes all fields needed by 03_users.sql (enterprise) AND new auth fields.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL UNIQUE,
  agency_id VARCHAR(50) NULL,
  user_type VARCHAR(50) NOT NULL DEFAULT 'AgencyAdmin',
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50) NULL,
  google_id VARCHAR(255) NULL,
  profile_picture VARCHAR(500) NULL,
  password_hash VARCHAR(255) NULL,
  otp_secret VARCHAR(100) NULL,
  token_version INT NOT NULL DEFAULT 1,
  status ENUM('Active', 'Inactive', 'Blocked') NOT NULL DEFAULT 'Active',
  avatar_url VARCHAR(500) NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_phone (phone),
  INDEX idx_users_google_id (google_id),
  INDEX idx_users_agency_type (agency_id, user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Agency Portal User Linking Table
CREATE TABLE IF NOT EXISTS agency_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Agency Owner',
  is_owner TINYINT(1) NOT NULL DEFAULT 0,
  permissions TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_agency_user UNIQUE (agency_id, user_id),
  CONSTRAINT fk_am_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Yatra Team Admin Linking Table
CREATE TABLE IF NOT EXISTS team_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'Admin',
  permissions TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tm_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Persistent OTP Store (5-minute expiration, portal-aware)
CREATE TABLE IF NOT EXISTS otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  portal VARCHAR(50) NOT NULL DEFAULT 'agency',
  mode VARCHAR(50) NOT NULL DEFAULT 'register',
  expires_at DATETIME NOT NULL,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otps_lookup (identifier, is_used, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. JWT Refresh Token Store
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_rt_lookup (user_id, revoked, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
