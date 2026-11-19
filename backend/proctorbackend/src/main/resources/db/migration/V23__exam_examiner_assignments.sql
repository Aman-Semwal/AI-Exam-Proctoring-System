-- ============================================================
-- V23__exam_examiner_assignments.sql
-- Creates a many-to-many junction table to map exams to examiners.
-- This allows Org Admins to explicitly assign examiners to set 
-- questions for scheduled exams.
-- ============================================================

CREATE TABLE IF NOT EXISTS exam_examiner_assignments (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL,
    examiner_id BIGINT NOT NULL,
    organization_id BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ex_examiner_asgn_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT fk_ex_examiner_asgn_user FOREIGN KEY (examiner_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ex_examiner_asgn_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT uq_exam_creator_assignment UNIQUE (exam_id, examiner_id)
);

CREATE INDEX idx_ex_examiner_asgn_exam ON exam_examiner_assignments(exam_id);
CREATE INDEX idx_ex_examiner_asgn_user ON exam_examiner_assignments(examiner_id);
