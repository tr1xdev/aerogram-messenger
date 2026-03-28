CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY,
    username            VARCHAR(16) UNIQUE,
    first_name          VARCHAR(50) NOT NULL,
    last_name           VARCHAR(50),
    email               VARCHAR(255) UNIQUE,
    password            TEXT NULL,
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
    is_bot              BOOLEAN NOT NULL DEFAULT FALSE,
    bot_token_hash      TEXT,
    bot_owner_id        UUID,
    bot_description     TEXT,
    bot_commands        JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,

    CONSTRAINT fk_users_bot_owner FOREIGN KEY (bot_owner_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT check_user_password CHECK (is_bot = TRUE OR password IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_is_bot ON users(is_bot);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_bot_token_hash ON users(bot_token_hash) WHERE bot_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_bot_owner_id ON users(bot_owner_id) WHERE bot_owner_id IS NOT NULL;
