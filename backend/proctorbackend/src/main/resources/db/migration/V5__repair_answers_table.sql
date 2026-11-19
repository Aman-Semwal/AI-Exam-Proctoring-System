-- Repairs databases that were initialized before the answers table was included.
-- Safe for fresh databases because all objects are created only when missing.
CREATE TABLE IF NOT EXISTS answers (
    id              BIGSERIAL PRIMARY KEY,
    session_id      BIGINT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_id     BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option VARCHAR(10) NOT NULL,
    is_correct      BOOLEAN NOT NULL DEFAULT FALSE,
    answered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_session_question UNIQUE (session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_session ON answers(session_id);
