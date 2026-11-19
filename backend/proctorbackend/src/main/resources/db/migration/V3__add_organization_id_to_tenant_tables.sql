-- ============================================================
-- V3__add_organization_id_to_tenant_tables.sql
-- Add organization_id FK to all tenant-scoped tables.
--
-- Approach:
--   Step 1: Add column as nullable (safe for existing data)
--   Step 2: Backfill — set a default org for existing rows
--   Step 3: Add NOT NULL + FK constraint (where appropriate)
--
-- NOTE: Before running on a live database with existing data,
-- insert a seed "Default Org" first:
--   INSERT INTO organizations (name, slug, plan)
--   VALUES ('Default Org', 'default', 'PRO')
--   ON CONFLICT (slug) DO NOTHING;
-- Then update the backfill statements below if org id != 1.
-- ============================================================

-- -----------------------------------------------------------
-- USERS — belongs to an org; SUPER_ADMIN users have NULL org
-- -----------------------------------------------------------
INSERT INTO organizations (name, slug, plan)
VALUES ('Default Org', 'default', 'PRO')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id BIGINT;

-- Backfill existing users to Default Org (id=1).
-- SUPER_ADMIN rows can stay NULL â€” enforced at application level.
UPDATE users SET organization_id = (SELECT id FROM organizations WHERE slug = 'default')
WHERE organization_id IS NULL
  AND role NOT IN ('SUPER_ADMIN');

ALTER TABLE users
    ADD CONSTRAINT fk_users_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX idx_users_org ON users(organization_id);

-- -----------------------------------------------------------
-- EXAMS
-- -----------------------------------------------------------
ALTER TABLE exams ADD COLUMN IF NOT EXISTS organization_id BIGINT;

-- Derive org from the exam creator's org
UPDATE exams e
SET organization_id = (
    SELECT u.organization_id FROM users u WHERE u.id = e.created_by
)
WHERE organization_id IS NULL;

ALTER TABLE exams
    ALTER COLUMN organization_id SET NOT NULL,
    ADD CONSTRAINT fk_exams_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_exams_org ON exams(organization_id);

-- -----------------------------------------------------------
-- EXAM_ASSIGNMENTS
-- -----------------------------------------------------------
ALTER TABLE exam_assignments ADD COLUMN IF NOT EXISTS organization_id BIGINT;

UPDATE exam_assignments ea
SET organization_id = (
    SELECT e.organization_id FROM exams e WHERE e.id = ea.exam_id
)
WHERE organization_id IS NULL;

ALTER TABLE exam_assignments
    ALTER COLUMN organization_id SET NOT NULL,
    ADD CONSTRAINT fk_assignments_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_assignments_org ON exam_assignments(organization_id);

-- -----------------------------------------------------------
-- EXAM_SESSIONS
-- -----------------------------------------------------------
ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS organization_id BIGINT;

UPDATE exam_sessions es
SET organization_id = (
    SELECT e.organization_id FROM exams e WHERE e.id = es.exam_id
)
WHERE organization_id IS NULL;

ALTER TABLE exam_sessions
    ALTER COLUMN organization_id SET NOT NULL,
    ADD CONSTRAINT fk_sessions_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_sessions_org ON exam_sessions(organization_id);

-- -----------------------------------------------------------
-- VIOLATIONS
-- -----------------------------------------------------------
ALTER TABLE violations ADD COLUMN IF NOT EXISTS organization_id BIGINT;

UPDATE violations v
SET organization_id = (
    SELECT es.organization_id
    FROM exam_sessions es WHERE es.id = v.session_id
)
WHERE organization_id IS NULL;

ALTER TABLE violations
    ALTER COLUMN organization_id SET NOT NULL,
    ADD CONSTRAINT fk_violations_org
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_violations_org ON violations(organization_id);
