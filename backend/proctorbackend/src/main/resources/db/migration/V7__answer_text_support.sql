-- ============================================================
-- V7__answer_text_support.sql
-- 1. Makes selected_option nullable (required for CODING/DESCRIPTIVE/FILL_BLANK)
-- 2. Adds text_answer TEXT column for text-based question types
-- ============================================================

ALTER TABLE answers
    ALTER COLUMN selected_option DROP NOT NULL;

ALTER TABLE answers
    ADD COLUMN IF NOT EXISTS text_answer TEXT;
