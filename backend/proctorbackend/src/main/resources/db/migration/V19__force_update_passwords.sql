-- ============================================================
-- V19__force_update_passwords.sql
-- Forces the passwords to Admin@1234 since ON CONFLICT DO NOTHING
-- in previous scripts prevented updating old rows.
-- ============================================================

UPDATE users 
SET password = '$2a$10$7QJ8z1V3kLmN9pXwYhR2OeD5sGfKtUiMjBcAqWnElPvHoZrXyS4Cu' 
WHERE email IN (
    'admin@tech.edu',
    'examiner@tech.edu',
    'proctor@tech.edu',
    'student@tech.edu',
    'superadmin@proctor.com'
);
