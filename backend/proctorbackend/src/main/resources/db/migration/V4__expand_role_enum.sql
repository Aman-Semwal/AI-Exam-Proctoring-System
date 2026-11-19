-- ============================================================
-- V4__expand_role_enum.sql
-- Remap legacy role values to new 5-role model.
--
-- The role column is VARCHAR (JPA EnumType.STRING), so no
-- PostgreSQL TYPE alteration is needed — just UPDATE the rows.
--
-- Mapping:
--   EXAMINER  → EXAM_CREATOR  (closest semantic match)
--   ADMIN     → ORG_ADMIN
--   STUDENT   → STUDENT       (unchanged)
--
-- After this migration, manually promote any platform owner
-- to SUPER_ADMIN, and assign PROCTOR role where needed.
--
-- Plan this migration during a maintenance window:
-- existing active JWTs still carry old role strings and will
-- fail @PreAuthorize checks until they expire (default 24h).
-- ============================================================

-- Remap EXAMINER → EXAM_CREATOR
UPDATE users SET role = 'EXAM_CREATOR' WHERE role = 'EXAMINER';

-- Remap ADMIN → ORG_ADMIN
UPDATE users SET role = 'ORG_ADMIN' WHERE role = 'ADMIN';

-- STUDENT stays unchanged — no action needed.

-- Verification query (should return 0 rows after migration):
-- SELECT id, email, role FROM users
-- WHERE role NOT IN ('SUPER_ADMIN', 'ORG_ADMIN', 'EXAM_CREATOR', 'PROCTOR', 'STUDENT');
