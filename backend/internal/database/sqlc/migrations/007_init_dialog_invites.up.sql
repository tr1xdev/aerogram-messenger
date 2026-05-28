CREATE TABLE IF NOT EXISTS dialog_invites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dialog_id   UUID NOT NULL REFERENCES dialogs(id) ON DELETE CASCADE,
    creator_id  UUID NOT NULL REFERENCES users(id),
    invite_code VARCHAR(32) NOT NULL UNIQUE,
    name        VARCHAR(255),
    usage_limit INT,
    usage_count INT NOT NULL DEFAULT 0,
    expire_at   TIMESTAMPTZ,
    is_revoked  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dialog_invites_dialog_id ON dialog_invites(dialog_id);
CREATE INDEX IF NOT EXISTS idx_dialog_invites_code ON dialog_invites(invite_code);

ALTER TABLE dialog_members
ADD COLUMN IF NOT EXISTS invite_id UUID REFERENCES dialog_invites(id) ON DELETE SET NULL;
