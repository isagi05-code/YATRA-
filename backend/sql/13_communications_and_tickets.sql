-- ============================================================================
-- YATRA ERP - Enterprise Multi-Tenant Schema: Notifications, Documents, AI Chat & Support
-- Target DB Engine: MySQL 8.x
-- ============================================================================

USE yatra_enterprise;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NULL,
  user_id VARCHAR(50) NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  `date` DATE NULL,
  `read` TINYINT(1) NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_notif_agency_read (agency_id, `read`, `date`),
  INDEX idx_notif_user_read (user_id, `read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NULL,
  user_id VARCHAR(50) NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  file_url VARCHAR(255) NOT NULL,
  upload_date DATE NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doc_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_doc_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_doc_agency (agency_id),
  INDEX idx_doc_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_sessions (
  session_id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id VARCHAR(50) NULL,
  user_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
  portal ENUM('AgencyPortal', 'TravellerPortal', 'TeamPortal') NOT NULL DEFAULT 'AgencyPortal',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cs_agency FOREIGN KEY (agency_id) REFERENCES agencies(agency_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_cs_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_cs_user (user_id, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  sender_type ENUM('User', 'AI_Assistant', 'SupportAgent') NOT NULL,
  message_text TEXT NOT NULL,
  tokens_used INT NOT NULL DEFAULT 0,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cm_session FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_cm_session (session_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id INT NULL,
  agency_code VARCHAR(50) NULL,
  traveller_id INT NULL,
  user_id VARCHAR(50) NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(100) NOT NULL DEFAULT 'Open',
  priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
  `date` DATE NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_st_agency FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_st_agency_code FOREIGN KEY (agency_code) REFERENCES agencies(agency_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_st_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_st_agency_status (agency_code, status),
  INDEX idx_st_status (status, priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
