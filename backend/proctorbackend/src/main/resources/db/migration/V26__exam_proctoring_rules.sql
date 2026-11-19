-- ============================================================
-- V26__exam_proctoring_rules.sql
-- Per-exam proctoring configuration. Defaults keep existing
-- exams behaving exactly as before.
-- ============================================================

ALTER TABLE exams
    ADD COLUMN IF NOT EXISTS identity_check_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS audio_monitoring_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS gaze_tracking_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS object_detection_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS tab_switch_limit         INTEGER NOT NULL DEFAULT 2;
