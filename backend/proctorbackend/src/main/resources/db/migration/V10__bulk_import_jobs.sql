CREATE TABLE bulk_import_jobs (
    id              BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    uploaded_by_id  BIGINT NOT NULL REFERENCES users(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    file_name       VARCHAR(255),
    total_rows      INT NOT NULL DEFAULT 0,
    success_count   INT NOT NULL DEFAULT 0,
    failed_count    INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMP
);

CREATE TABLE bulk_import_errors (
    id          BIGSERIAL PRIMARY KEY,
    job_id      BIGINT NOT NULL REFERENCES bulk_import_jobs(id) ON DELETE CASCADE,
    row_number  INT NOT NULL,
    email       VARCHAR(255),
    reason      TEXT NOT NULL
);

CREATE INDEX idx_bij_org_id ON bulk_import_jobs(organization_id);
CREATE INDEX idx_bie_job_id ON bulk_import_errors(job_id);
