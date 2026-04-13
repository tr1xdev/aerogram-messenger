CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY,
    dialog_id       UUID NOT NULL REFERENCES dialogs(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    is_encrypted    BOOLEAN NOT NULL DEFAULT FALSE,
    encryption_iv   TEXT,
    sequence        BIGSERIAL NOT NULL,
    reply_to_id     UUID REFERENCES messages(id) ON DELETE SET NULL,
    forward_from_id UUID,
    is_edited       BOOLEAN NOT NULL DEFAULT FALSE,
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
    is_system       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_dialog_sequence ON messages(dialog_id, sequence);
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at);

CREATE TABLE IF NOT EXISTS message_attachments (
    id           UUID PRIMARY KEY,
    message_id   UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    type         VARCHAR(50) NOT NULL,
    file_name    TEXT NOT NULL,
    file_size    BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON message_attachments(message_id);

CREATE TABLE IF NOT EXISTS message_revisions (
    id          UUID PRIMARY KEY,
    message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    old_text    TEXT NOT NULL,
    editor_id   UUID NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_revisions_message_id ON message_revisions(message_id);

CREATE TABLE IF NOT EXISTS message_actions (
    id          UUID PRIMARY KEY,
    message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id),
    action_type SMALLINT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_actions_message_id ON message_actions(message_id);
