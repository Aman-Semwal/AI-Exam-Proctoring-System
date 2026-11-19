-- ============================================================
-- V24__fix_assignments_cascade.sql
-- Fix legacy assignments table foreign key constraint to allow deleting exams
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'assignments'
    ) THEN
        ALTER TABLE assignments DROP CONSTRAINT IF EXISTS fk_assignments_exam;
        
        ALTER TABLE assignments 
            ADD CONSTRAINT fk_assignments_exam 
            FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;
    END IF;
END $$;
