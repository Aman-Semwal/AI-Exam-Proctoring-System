-- ============================================================
-- V15__fix_super_admin_password.sql
-- Ensures the Super Admin user exists with a valid bcrypt hash.
--
-- Email   : superadmin@proctor.com
-- Password: Admin@1234
-- Hash    : bcrypt cost=12  ← matches BCryptPasswordEncoder(12) in SecurityConfig
--           Verified: BCrypt.checkpw("Admin@1234", hash) == true
-- ============================================================

-- Upsert: insert fresh if missing, or overwrite the bad hash from V14
INSERT INTO users (name, email, password, role, created_at, updated_at)
VALUES (
    'Super Admin',
    'superadmin@proctor.com',
    '$2a$12$PcdbbkQh9OgKOH3cyQlkFuQQVmjxCw9zfEqaCXSSx8AM2/5qxhsP6',
    'SUPER_ADMIN',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE
    SET password   = '$2a$12$PcdbbkQh9OgKOH3cyQlkFuQQVmjxCw9zfEqaCXSSx8AM2/5qxhsP6',
        role       = 'SUPER_ADMIN',
        updated_at = NOW();
