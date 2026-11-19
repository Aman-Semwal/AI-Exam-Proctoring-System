-- ============================================================
-- V32__exam_integrity_additions.sql
-- Screen monitoring + clipboard blocking rules per exam, the
-- student's consent time, and the kind of each evidence image
-- (webcam CAMERA or screenshot SCREEN).
-- ============================================================

ALTER TABLE exams
    ADD COLUMN IF NOT EXISTS screen_monitoring_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS clipboard_blocking_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS consent_given_at TIMESTAMP NULL;

ALTER TABLE violation_evidence ADD COLUMN IF NOT EXISTS kind VARCHAR(10) NOT NULL DEFAULT 'CAMERA';

CREATE INDEX IF NOT EXISTS idx_violation_evidence_violation_kind ON violation_evidence(violation_id, kind);
