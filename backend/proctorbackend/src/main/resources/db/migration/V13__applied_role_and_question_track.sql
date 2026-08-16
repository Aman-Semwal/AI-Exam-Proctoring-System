-- applied_role on users: stores which job role the student applied for (e.g. SDE1, SDE2, DevOps)
ALTER TABLE users ADD COLUMN IF NOT EXISTS applied_role VARCHAR(100);

-- track on questions: filters which candidates see this question (e.g. SDE1, SDE2, COMMON)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS track VARCHAR(100) DEFAULT 'COMMON';

-- track on exam_assignments: copied from student's applied_role at assignment time
ALTER TABLE exam_assignments ADD COLUMN IF NOT EXISTS track VARCHAR(100);
