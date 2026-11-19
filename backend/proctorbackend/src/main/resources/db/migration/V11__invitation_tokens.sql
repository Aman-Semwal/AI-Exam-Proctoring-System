ALTER TABLE users
    ADD COLUMN IF NOT EXISTS invitation_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS invitation_token_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS invitation_token_expires_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMP;
