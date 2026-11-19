-- ============================================================
-- V29__answers_is_correct_nullable.sql
-- DESCRIPTIVE and CODING answers have no automatic verdict: the
-- application stores is_correct = NULL until an examiner grades
-- them. V1/V5 declared the column NOT NULL, so saving any such
-- answer failed with a constraint violation (HTTP 500).
-- ============================================================

ALTER TABLE answers ALTER COLUMN is_correct DROP NOT NULL;
ALTER TABLE answers ALTER COLUMN is_correct DROP DEFAULT;
