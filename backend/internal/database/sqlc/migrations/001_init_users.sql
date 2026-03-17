CREATE TABLE users (
    id                  UUID PRIMARY KEY,
    username            VARCHAR(16) UNIQUE,
    first_name          VARCHAR(50) NOT NULL,
    last_name           VARCHAR(50),
    email               VARCHAR(255) NOT NULL UNIQUE,
    password            TEXT NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'OFFLINE',
    photo_url           TEXT,
    is_premium          BOOLEAN NOT NULL DEFAULT FALSE,
    is_email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token  TEXT,
    verification_expiry TIMESTAMPTZ,
    public_key          TEXT,
    encrypted_priv_key  TEXT,
    encryption_iv       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
