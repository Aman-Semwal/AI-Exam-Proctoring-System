-- ============================================================
-- V6__multi_type_questions.sql
-- Adds question_type + metadata columns to questions table.
-- Makes options and correct_option nullable to support
-- CODING and DESCRIPTIVE question types.
-- ============================================================

-- 1. Add question_type column (default MCQ so existing rows are valid)
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS question_type VARCHAR(20) NOT NULL DEFAULT 'MCQ';

-- 2. Add metadata JSONB column for type-specific extra data
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 3. Make options nullable — not required for CODING/DESCRIPTIVE/TRUE_FALSE/FILL_BLANK
ALTER TABLE questions
    ALTER COLUMN options DROP NOT NULL;

-- 4. Make correct_option nullable — not required for CODING/DESCRIPTIVE
--    Also widen to 500 chars to allow FILL_BLANK answer text
ALTER TABLE questions
    ALTER COLUMN correct_option DROP NOT NULL;

ALTER TABLE questions
    ALTER COLUMN correct_option TYPE VARCHAR(500);

-- 5. Index on question_type for fast filtering (e.g. "get all CODING questions for exam")
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(question_type);
