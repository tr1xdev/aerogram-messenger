CREATE TABLE IF NOT EXISTS dialogs (
    id                UUID PRIMARY KEY,
    type              VARCHAR(20) NOT NULL,
    name              VARCHAR(255),
    username          VARCHAR(32),
    photo_url         VARCHAR(2048),
    bio               TEXT,
    description       TEXT,
    invite_link       VARCHAR(255) UNIQUE,
    pinned_message_id UUID,
    creator_id        UUID REFERENCES users(id),
    last_message_id   UUID,
    last_message_at   TIMESTAMPTZ,
    members_count     INT NOT NULL DEFAULT 1,
    is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dialogs_username ON dialogs(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dialogs_type ON dialogs(type);
CREATE INDEX IF NOT EXISTS idx_dialogs_deleted_at ON dialogs(deleted_at);

CREATE TABLE IF NOT EXISTS dialog_settings (
    dialog_id             UUID PRIMARY KEY REFERENCES dialogs(id) ON DELETE CASCADE,
    permissions           BIGINT NOT NULL DEFAULT 0,
    slow_mode_delay       INT NOT NULL DEFAULT 0,
    is_history_hidden     BOOLEAN NOT NULL DEFAULT FALSE,
    is_signatures_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
