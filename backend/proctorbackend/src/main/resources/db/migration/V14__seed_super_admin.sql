-- ============================================================
-- V14__seed_super_admin.sql
-- Seeds the default Super Admin user.
-- Email   : superadmin@proctor.com
-- Password: Admin@1234  (bcrypt, cost=10)
-- ============================================================

INSERT INTO users (name, email, password, role, created_at, updated_at)
VALUES (
    'Super Admin',
    'superadmin@proctor.com',
    '$2a$10$7QJ8z1V3kLmN9pXwYhR2OeD5sGfKtUiMjBcAqWnElPvHoZrXyS4Cu',
    'SUPER_ADMIN',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;
