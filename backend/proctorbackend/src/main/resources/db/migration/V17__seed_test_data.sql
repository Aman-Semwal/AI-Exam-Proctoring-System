-- ============================================================
-- V17__seed_test_data.sql
-- Seeds an organization, examiner, proctor, and student.
-- All passwords are: Admin@1234
-- ============================================================

-- 1. Create Organization
INSERT INTO organizations (name, slug, plan)
VALUES ('Tech University', 'tech-university', 'PRO')
ON CONFLICT (slug) DO NOTHING;

-- 2. Create Examiner
INSERT INTO users (name, email, password, role, organization_id, created_at, updated_at)
VALUES (
    'Test Examiner',
    'examiner@tech.edu',
    '$2a$10$7QJ8z1V3kLmN9pXwYhR2OeD5sGfKtUiMjBcAqWnElPvHoZrXyS4Cu',
    'EXAM_CREATOR',
    (SELECT id FROM organizations WHERE slug = 'tech-university'),
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 3. Create Proctor
INSERT INTO users (name, email, password, role, organization_id, created_at, updated_at)
VALUES (
    'Test Proctor',
    'proctor@tech.edu',
    '$2a$10$7QJ8z1V3kLmN9pXwYhR2OeD5sGfKtUiMjBcAqWnElPvHoZrXyS4Cu',
    'PROCTOR',
    (SELECT id FROM organizations WHERE slug = 'tech-university'),
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 4. Create Student
INSERT INTO users (name, email, password, role, organization_id, created_at, updated_at)
VALUES (
    'Test Student',
    'student@tech.edu',
    '$2a$10$7QJ8z1V3kLmN9pXwYhR2OeD5sGfKtUiMjBcAqWnElPvHoZrXyS4Cu',
    'STUDENT',
    (SELECT id FROM organizations WHERE slug = 'tech-university'),
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;
