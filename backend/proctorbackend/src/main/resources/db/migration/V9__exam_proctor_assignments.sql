CREATE TABLE exam_proctor_assignments (
    id              BIGSERIAL PRIMARY KEY,
    exam_id         BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    examiner_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id BIGINT REFERENCES organizations(id),
    assigned_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_exam_examiner UNIQUE (exam_id, examiner_id)
);

CREATE INDEX idx_epa_exam_id     ON exam_proctor_assignments(exam_id);
CREATE INDEX idx_epa_examiner_id ON exam_proctor_assignments(examiner_id);
