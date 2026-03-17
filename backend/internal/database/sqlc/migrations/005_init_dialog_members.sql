CREATE TABLE dialog_members (
    dialog_id             UUID NOT NULL REFERENCES dialogs(id) ON DELETE CASCADE,
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role                  VARCHAR(20) NOT NULL DEFAULT 'member',
    joined_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_read_message_id  UUID,
    last_read_sequence    BIGINT NOT NULL DEFAULT 0,
    muted_until           TIMESTAMPTZ,
    is_pinned             BOOLEAN NOT NULL DEFAULT FALSE,
    is_hidden             BOOLEAN NOT NULL DEFAULT FALSE,
    custom_title          VARCHAR(100),
    notifications_on      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (dialog_id, user_id)
);

CREATE INDEX idx_dialog_members_user_id ON dialog_members(user_id);
CREATE INDEX idx_dialog_members_role ON dialog_members(role);
