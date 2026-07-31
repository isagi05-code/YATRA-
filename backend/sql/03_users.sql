-- ============================================================================
-- YATRA ERP - Enterprise Multi-Tenant Schema: Users
-- Target DB Engine: MySQL 8.x
-- NOTE: users table is already created in 00_auth_tables.sql with additional
-- auth columns (token_version, password_hash etc). This script is a no-op.
-- ============================================================================

USE yatra_enterprise;

-- users table is already created in 00_auth_tables.sql
-- This file intentionally left as a stub to preserve script ordering.
SELECT 'users table already created in 00_auth_tables.sql' AS info;
