-- ============================================================
-- V2__multi_tenant_foundation.sql
-- Multi-tenant SaaS foundation: new tables
-- ============================================================

-- -----------------------------------------------------------
-- ORGANIZATIONS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    slug       VARCHAR(100) NOT NULL UNIQUE,     -- URL-safe identifier, e.g. "mit-eecs"
    plan       VARCHAR(50)  NOT NULL DEFAULT 'FREE',  -- FREE | PRO | ENTERPRISE
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- -----------------------------------------------------------
-- SUBSCRIPTIONS  (scaffold only — billing wired in Phase 6)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
    id                   BIGSERIAL    PRIMARY KEY,
    organization_id      BIGINT       NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan                 VARCHAR(50)  NOT NULL,                    -- FREE | PRO | ENTERPRISE
    status               VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | CANCELLED | PAST_DUE
    billing_cycle        VARCHAR(20)  NOT NULL DEFAULT 'MONTHLY',  -- MONTHLY | ANNUAL
    current_period_start TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    current_period_end   TIMESTAMPTZ  NOT NULL,
    external_sub_id      VARCHAR(255),  -- Stripe / Razorpay subscription ID
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);

-- -----------------------------------------------------------
-- AUDIT_LOGS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id              BIGSERIAL    PRIMARY KEY,
    organization_id BIGINT       REFERENCES organizations(id) ON DELETE SET NULL,  -- NULL = platform-level action
    actor_id        BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,   -- e.g. EXAM_CREATED, USER_INVITED, SESSION_TERMINATED
    entity_type     VARCHAR(100),            -- e.g. Exam, User, ExamSession
    entity_id       BIGINT,
    metadata        JSONB,
    ip_address      INET,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org     ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor   ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- -----------------------------------------------------------
-- NOTIFICATIONS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id                  BIGSERIAL    PRIMARY KEY,
    organization_id     BIGINT       REFERENCES organizations(id) ON DELETE CASCADE,
    recipient_id        BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                VARCHAR(100) NOT NULL,   -- e.g. VIOLATION_ALERT, EXAM_PUBLISHED, INVITE
    title               VARCHAR(255) NOT NULL,
    body                TEXT,
    is_read             BOOLEAN      NOT NULL DEFAULT FALSE,
    related_entity_type VARCHAR(100),
    related_entity_id   BIGINT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_org       ON notifications(organization_id);
