-- ============================================================
-- V21__fix_all_passwords.sql
-- Fixes the password hash for Admin@1234 since the previous hash was incorrect
-- ============================================================

UPDATE users 
SET password = '$2a$12$7HkKiUtIWHqE35TRPSXwVeLJ4zhzzeL2bIxFBz.7hOe9idCdQs/N6'
WHERE email IN (
    'admin@tech.edu',
    'examiner@tech.edu',
    'proctor@tech.edu',
    'student@tech.edu',
    'superadmin@proctor.com',
    'subagent-admin@test.com',
    'subagent-proctor@test.com',
    'subagent-examiner@test.com',
    'subagent-student@test.com'
);
