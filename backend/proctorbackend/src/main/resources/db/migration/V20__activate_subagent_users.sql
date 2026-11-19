-- ============================================================
-- V20__activate_subagent_users.sql
-- Activates the users created by the browser subagent since 
-- the mail server is disabled and they cannot click the activation link.
-- ============================================================

UPDATE users
SET invitation_status = 'ACTIVE',
    password = '$2a$10$7QJ8z1V3kLmN9pXwYhR2OeD5sGfKtUiMjBcAqWnElPvHoZrXyS4Cu',
    invitation_token_hash = NULL,
    invitation_token_expires_at = NULL,
    invitation_accepted_at = NOW()
WHERE email IN (
    'subagent-admin@test.com',
    'subagent-proctor@test.com',
    'subagent-examiner@test.com',
    'subagent-student@test.com'
);

-- Fix the proctor's role since the subagent accidentally selected STUDENT
UPDATE users 
SET role = 'PROCTOR' 
WHERE email = 'subagent-proctor@test.com';
