-- name: CreateDialogInvite :one
INSERT INTO dialog_invites (
    dialog_id, creator_id, invite_code, name, usage_limit, expire_at
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetInviteByCode :one
SELECT * FROM dialog_invites
WHERE invite_code = $1
  AND is_revoked = false
  AND (expire_at IS NULL OR expire_at > NOW())
  AND (usage_limit IS NULL OR usage_count < usage_limit)
LIMIT 1;

-- name: IncrementInviteUsage :exec
UPDATE dialog_invites
SET usage_count = usage_count + 1, updated_at = NOW()
WHERE id = $1;

-- name: JoinDialogByInvite :exec
INSERT INTO dialog_members (
    dialog_id, user_id, role, invite_id, joined_at, notifications_on, updated_at
) VALUES (
    $1, $2, $3, $4, NOW(), true, NOW()
) ON CONFLICT (dialog_id, user_id) DO UPDATE SET
    is_hidden = false,
    updated_at = NOW();

-- name: GetDialogInvites :many
SELECT * FROM dialog_invites
WHERE dialog_id = $1
ORDER BY created_at DESC;

-- name: RevokeInvite :exec
UPDATE dialog_invites
SET is_revoked = true, updated_at = NOW()
WHERE invite_code = $1 AND dialog_id = $2;
