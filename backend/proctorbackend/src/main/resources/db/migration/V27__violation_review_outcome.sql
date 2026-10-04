-- ============================================================
-- V27__violation_review_outcome.sql
-- A reviewer's decision on a violation: CONFIRMED or DISMISSED
-- (false positive). NULL = not reviewed yet. Existing reviewed
-- rows are treated as CONFIRMED.
-- ============================================================

ALTER TABLE violations
    ADD COLUMN IF NOT EXISTS review_outcome VARCHAR(20);

UPDATE violations SET review_outcome = 'CONFIRMED'
WHERE reviewed = TRUE AND review_outcome IS NULL;
