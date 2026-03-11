-- name: CreateDialog :one
INSERT INTO dialogs (
    id, type, name, username, photo_url, bio, description,
    invite_link, creator_id, members_count, is_active,
    is_verified, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
) RETURNING *;

-- name: AddDialogMember :exec
INSERT INTO dialog_members (
    dialog_id, user_id, role, joined_at, notifications_on,
    is_pinned, last_read_sequence, created_at, updated_at
) VALUES (
    $1, $2, $3, NOW(), $4, $5, $6, NOW(), NOW()
);

-- name: PinDialog :exec
UPDATE dialog_members
SET is_pinned = $3, updated_at = NOW()
WHERE dialog_id = $1 AND user_id = $2;

-- name: CreateDialogSettings :exec
INSERT INTO dialog_settings (
    dialog_id, permissions, slow_mode_delay, is_history_hidden,
    is_signatures_enabled, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, NOW(), NOW()
);

-- name: GetDialogByID :one
SELECT * FROM dialogs WHERE id = $1 LIMIT 1;

-- name: GetUserDialogs :many
SELECT
    d.*,
    dm.is_pinned,
    dm.last_read_sequence,
    (
        SELECT count(*)
        FROM messages m
        WHERE m.dialog_id = d.id
          AND m.sequence > dm.last_read_sequence
          AND m.author_id != $1
    ) AS unread_count
FROM dialogs d
JOIN dialog_members dm ON dm.dialog_id = d.id
WHERE dm.user_id = $1
  AND d.deleted_at IS NULL
  AND (
    d.creator_id = $1
    OR EXISTS (SELECT 1 FROM messages m WHERE m.dialog_id = d.id LIMIT 1)
  )
ORDER BY dm.is_pinned DESC, COALESCE(d.last_message_at, d.created_at) DESC;

-- name: GetDialogMember :one
SELECT * FROM dialog_members
WHERE dialog_id = $1 AND user_id = $2 LIMIT 1;

-- name: GetDialogMembers :many
SELECT * FROM dialog_members WHERE dialog_id = $1;

-- name: GetDialogByUsername :one
SELECT * FROM dialogs
WHERE username = $1
  AND is_active = true
LIMIT 1;

-- name: CountPinnedDialogs :one
SELECT COUNT(*)
FROM dialog_members
WHERE user_id = $1 AND is_pinned = true;

-- name: DeleteDialog :exec
UPDATE dialogs
SET deleted_at = NOW(), is_active = false
WHERE id = $1;
