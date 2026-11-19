-- ============================================================
-- V1__initial_schema.sql
-- Baseline schema: captures the existing single-tenant tables
-- as they are before the multi-tenant migration begins.
-- ============================================================

-- -----------------------------------------------------------
-- USERS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(50)  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------
-- EXAMS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS exams (
    id               BIGSERIAL    PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    description      VARCHAR(1000),
    duration_minutes INTEGER      NOT NULL,
    start_time       TIMESTAMPTZ  NOT NULL,
    end_time         TIMESTAMPTZ  NOT NULL,
    created_by       BIGINT       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exams_created_by ON exams(created_by);

-- -----------------------------------------------------------
-- EXAM_SESSIONS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_sessions (
    id             BIGSERIAL   PRIMARY KEY,
    exam_id        BIGINT      NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_number INTEGER     NOT NULL DEFAULT 1,
    status         VARCHAR(50) NOT NULL,
    start_time     TIMESTAMPTZ,
    end_time       TIMESTAMPTZ,
    score          INTEGER,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_exam    ON exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student ON exam_sessions(student_id);

-- -----------------------------------------------------------
-- PROCTORING_EVENTS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS proctoring_events (
    id          BIGSERIAL    PRIMARY KEY,
    session_id  BIGINT       NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    event_type  VARCHAR(50)  NOT NULL,
    details     VARCHAR(500),
    face_count  INTEGER,
    detected_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proctoring_session ON proctoring_events(session_id);

-- -----------------------------------------------------------
-- QUESTIONS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
    id             BIGSERIAL     PRIMARY KEY,
    exam_id        BIGINT        NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_text  VARCHAR(2000) NOT NULL,
    options        JSONB         NOT NULL,
    correct_option VARCHAR(10)   NOT NULL,
    marks          INTEGER       NOT NULL,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);

-- -----------------------------------------------------------
-- ANSWERS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS answers (
    id              BIGSERIAL   PRIMARY KEY,
    session_id      BIGINT      NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_id     BIGINT      NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option VARCHAR(10) NOT NULL,
    is_correct      BOOLEAN     NOT NULL DEFAULT FALSE,
    answered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_session_question UNIQUE (session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_session ON answers(session_id);

-- -----------------------------------------------------------
-- VIOLATIONS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS violations (
    id         BIGSERIAL    PRIMARY KEY,
    session_id BIGINT       NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    type       VARCHAR(100) NOT NULL,
    severity   VARCHAR(50)  NOT NULL,
    details    VARCHAR(1000),
    reviewed   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_violations_session ON violations(session_id);

-- -----------------------------------------------------------
-- EXAM_ASSIGNMENTS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_assignments (
    id          BIGSERIAL   PRIMARY KEY,
    exam_id     BIGINT      NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id  BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_exam_student UNIQUE (exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_exam    ON exam_assignments(exam_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON exam_assignments(student_id);
