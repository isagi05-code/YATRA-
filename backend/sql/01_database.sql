-- ============================================================================
-- YATRA ERP - Enterprise Multi-Tenant Database Initialization
-- Target DB Engine: MySQL 8.x
-- Compatible with DBeaver / MySQL Workbench / CLI
-- ============================================================================

CREATE DATABASE IF NOT EXISTS yatra_enterprise
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE yatra_enterprise;

-- Verify database initialization
SELECT 'Database yatra_enterprise created successfully' AS status;
