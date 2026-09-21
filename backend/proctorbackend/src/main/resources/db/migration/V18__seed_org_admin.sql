-- ============================================================
-- V18__seed_org_admin.sql
-- Seeds an organization admin.
-- All passwords are: Admin@1234
-- ============================================================

INSERT INTO users (name, email, password, role, organization_id, created_at, updated_at)
VALUES (
    'Test Org Admin',
    'admin@tech.edu',
    '$2a$10$7QJ8z1V3kLmN9pXwYhR2OeD5sGfKtUiMjBcAqWnElPvHoZrXyS4Cu',
    'ORG_ADMIN',
    (SELECT id FROM organizations WHERE slug = 'tech-university'),
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;
