-- ============================================================
-- V28__violation_evidence.sql
-- Webcam frame that triggered each AI violation, so reviewers
-- can see why it was flagged. Deleted with its violation.
-- ============================================================

CREATE TABLE IF NOT EXISTS violation_evidence (
    id           BIGSERIAL    PRIMARY KEY,
    violation_id BIGINT       NOT NULL REFERENCES violations(id) ON DELETE CASCADE,
    content_type VARCHAR(50)  NOT NULL,
    data         BYTEA        NOT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_violation_evidence_violation ON violation_evidence(violation_id);
