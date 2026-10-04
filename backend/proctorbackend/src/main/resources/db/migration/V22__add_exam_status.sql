-- ============================================================
-- V22__add_exam_status.sql
-- Adds a status column to the exams table.
-- Existing exams default to 'DRAFT'.
-- ============================================================

ALTER TABLE exams
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'DRAFT';
