-- ============================================================
-- V25__session_reference_embedding.sql
-- Stores the face embedding of the live reference photo taken
-- before each exam (comma-separated floats). Used for identity
-- verification during the session.
-- ============================================================

ALTER TABLE exam_sessions
    ADD COLUMN IF NOT EXISTS reference_embedding TEXT;
