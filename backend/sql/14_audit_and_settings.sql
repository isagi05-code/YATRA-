-- ============================================================================
-- YATRA ERP - Enterprise Multi-Tenant Schema: Audit Logs, Settings & Timeline
-- Target DB Engine: MySQL 8.x
-- ============================================================================

USE yatra_enterprise;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NULL,
  user_id VARCHAR(50) NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  level VARCHAR(50) NOT NULL DEFAULT 'INFO',
  message TEXT NOT NULL,
  action VARCHAR(100) NULL,
  resource VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_al_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_al_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_al_agency_time (agency_id, `timestamp`),
  INDEX idx_al_level (level, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agency_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NULL,
  `key` VARCHAR(100) NOT NULL,
  `value` TEXT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_as_agency_key UNIQUE (agency_id, `key`),
  CONSTRAINT fk_set_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_as_agency_key (agency_id, `key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_timeline (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  activity_title VARCHAR(255) NOT NULL,
  activity_description TEXT NULL,
  performed_by VARCHAR(255) NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_act_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_act_agency_entity (agency_id, entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
