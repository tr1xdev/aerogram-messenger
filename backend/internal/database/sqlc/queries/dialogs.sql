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
    is_pinned, last_read_sequence, is_hidden, created_at, updated_at
) VALUES (
    $1, $2, $3, NOW(), $4, $5, $6, FALSE, NOW(), NOW()
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
    m.content AS msg_content,
    m.is_encrypted AS msg_is_encrypted,
    m.encryption_iv AS msg_encryption_iv,
    m.sequence AS msg_sequence,
    m.author_id AS msg_author_id,
    m.created_at AS msg_created_at,
    (
        SELECT count(*)
        FROM messages m2
        WHERE m2.dialog_id = d.id
          AND m2.sequence > dm.last_read_sequence
          AND m2.author_id != $1
          AND m2.is_deleted = false
    ) AS unread_count
FROM dialogs d
JOIN dialog_members dm ON dm.dialog_id = d.id
LEFT JOIN messages m ON d.last_message_id = m.id
WHERE dm.user_id = $1
  AND d.is_active = true
  AND dm.is_hidden = false
ORDER BY dm.is_pinned DESC, COALESCE(d.last_message_at, d.created_at) DESC;

-- name: HideDialogMember :exec
UPDATE dialog_members
SET is_hidden = true, updated_at = NOW()
WHERE dialog_id = $1 AND user_id = $2;

-- name: UnhideDialogForMembers :exec
UPDATE dialog_members
SET is_hidden = false, updated_at = NOW()
WHERE dialog_id = $1;

-- name: GetDialogMembers :many
SELECT * FROM dialog_members WHERE dialog_id = $1;

-- name: GetDialogMember :one
SELECT * FROM dialog_members
WHERE dialog_id = $1 AND user_id = $2 LIMIT 1;

-- name: GetDialogByUsername :one
SELECT * FROM dialogs
WHERE username = $1
  AND is_active = true
LIMIT 1;

-- name: CountPinnedDialogs :one
SELECT COUNT(*)
FROM dialog_members dm
JOIN dialogs d ON d.id = dm.dialog_id
WHERE dm.user_id = $1
  AND dm.is_pinned = true
  AND d.deleted_at IS NULL;

-- name: DeleteDialog :exec
UPDATE dialogs
SET deleted_at = NOW(), is_active = false
WHERE id = $1;

-- name: HardDeleteDialog :exec
DELETE FROM dialogs WHERE id = $1;

-- name: GetPrivateDialogByMembers :one
SELECT d.*
FROM dialogs d
JOIN dialog_members dm1 ON d.id = dm1.dialog_id
JOIN dialog_members dm2 ON d.id = dm2.dialog_id
WHERE d.type = 'private'
  AND dm1.user_id = $1
  AND dm2.user_id = $2
  AND d.is_active = true
LIMIT 1;
