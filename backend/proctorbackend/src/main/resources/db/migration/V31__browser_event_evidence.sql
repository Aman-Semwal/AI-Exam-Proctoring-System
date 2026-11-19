-- ============================================================
-- V31__browser_event_evidence.sql
-- Evidence for tab-switch / full-screen violations, so a disputed
-- auto-submit can be checked: which browser signal fired and how
-- long the student was away. (The webcam snapshot taken at that
-- moment is stored in violation_evidence, like AI violations.)
-- ============================================================

ALTER TABLE violations
    ADD COLUMN IF NOT EXISTS browser_signal VARCHAR(30),
    ADD COLUMN IF NOT EXISTS away_seconds   INTEGER;
