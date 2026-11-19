-- ============================================================
-- V16__reset_super_admin_password.sql
-- Force-updates the Super Admin password hash to cost=12.
--
-- V14 seeded with cost=10, V15 was edited before running so
-- its ON CONFLICT DO UPDATE never applied the correct hash.
-- This migration unconditionally sets the correct hash.
--
-- Email   : superadmin@proctor.com
-- Password: Admin@1234
-- Hash    : bcrypt cost=12 — matches BCryptPasswordEncoder(12) in SecurityConfig
-- ============================================================

UPDATE users
SET    password   = '$2a$12$PcdbbkQh9OgKOH3cyQlkFuQQVmjxCw9zfEqaCXSSx8AM2/5qxhsP6',
       updated_at = NOW()
WHERE  email = 'superadmin@proctor.com';
