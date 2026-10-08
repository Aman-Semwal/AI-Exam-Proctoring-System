-- ============================================================
-- V30__exam_max_attempts.sql
-- Attempts a student may make per exam. Before this, a student
-- could start a fresh attempt right after being auto-submitted
-- (clean tab-switch count), which made auto-submit pointless.
-- ============================================================

ALTER TABLE exams
    ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 1;
