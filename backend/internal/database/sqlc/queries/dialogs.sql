-- name: CreateDialog :one
INSERT INTO dialogs (
    id, type, name, username, photo_url, bio, description,
    invite_link, creator_id, members_count, is_active, is_verified,
    created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
) RETURNING *;

-- name: AddDialogMember :exec
INSERT INTO dialog_members (
    dialog_id, user_id, role, joined_at, notifications_on,
    is_pinned, last_read_sequence, is_hidden, created_at, updated_at
) VALUES (
    $1, $2, $3, NOW(), $4, $5, $6, $7, NOW(), NOW()
) ON CONFLICT (dialog_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    is_hidden = false,
    joined_at = NOW(),
    updated_at = NOW();

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
) ON CONFLICT (dialog_id) DO UPDATE SET
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- name: GetDialogByID :one
SELECT d.*
FROM dialogs d
LEFT JOIN dialog_members dm ON d.id = dm.dialog_id AND dm.user_id = sqlc.arg('user_id')
WHERE d.id = sqlc.arg('id')
  AND d.deleted_at IS NULL
  AND (d.username IS NOT NULL OR dm.user_id IS NOT NULL OR d.creator_id = sqlc.arg('user_id'))
LIMIT 1;

-- name: GetDialogByIDInternal :one
SELECT * FROM dialogs
WHERE id = $1 AND deleted_at IS NULL
LIMIT 1;

-- name: GetUserDialogs :many
SELECT
    d.id, d.type, d.name, d.username, d.photo_url, d.members_count,
    d.is_verified, d.is_active, d.last_message_id, d.last_message_at,
    dm.role, dm.is_pinned, dm.last_read_sequence,
    m.content AS msg_content,
    m.sequence AS msg_sequence,
    m.author_id AS msg_author_id,
    u.username AS msg_author_username,
    u.first_name AS msg_author_first_name,
    u.is_bot AS msg_author_is_bot,
    m.created_at AS msg_created_at,
    m.reply_to_id AS msg_reply_to_id,
    COALESCE(unread.count, 0) AS unread_count
FROM dialogs d
JOIN dialog_members dm ON dm.dialog_id = d.id
LEFT JOIN messages m ON d.last_message_id = m.id
LEFT JOIN users u ON m.author_id = u.id
LEFT JOIN LATERAL (
    SELECT count(*) as count
    FROM messages m2
    WHERE m2.dialog_id = d.id
      AND m2.sequence > dm.last_read_sequence
      AND m2.author_id != $1
      AND m2.is_deleted = false
) unread ON TRUE
WHERE dm.user_id = $1
  AND d.is_active = true
  AND d.deleted_at IS NULL
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
SELECT
    dm.dialog_id, dm.user_id, dm.role, dm.joined_at,
    u.username, u.first_name, u.last_name, u.photo_url, u.is_bot
FROM dialog_members dm
JOIN users u ON dm.user_id = u.id
WHERE dm.dialog_id = $1
  AND dm.is_hidden = false
ORDER BY dm.joined_at ASC;

-- name: GetDialogMember :one
SELECT * FROM dialog_members
WHERE dialog_id = $1 AND user_id = $2
LIMIT 1;

-- name: GetDialogByUsername :one
SELECT * FROM dialogs
WHERE username = $1
  AND is_active = true
  AND deleted_at IS NULL
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
SET deleted_at = NOW(), is_active = false, updated_at = NOW()
WHERE id = $1;

-- name: HardDeleteDialog :exec
DELETE FROM dialogs WHERE id = $1;

-- name: RemoveDialogMember :exec
DELETE FROM dialog_members
WHERE dialog_id = $1 AND user_id = $2;

-- name: IsDialogCreator :one
SELECT EXISTS (
    SELECT 1 FROM dialogs WHERE id = $1 AND creator_id = $2 AND deleted_at IS NULL
);

-- name: GetPrivateDialogByMembers :one
SELECT d.*
FROM dialogs d
JOIN dialog_members dm1 ON d.id = dm1.dialog_id
JOIN dialog_members dm2 ON d.id = dm2.dialog_id
WHERE d.type = 'private'
  AND d.members_count = 2
  AND dm1.user_id = $1
  AND dm2.user_id = $2
  AND dm1.user_id != dm2.user_id
  AND d.is_active = true
  AND d.deleted_at IS NULL
LIMIT 1;

-- name: GetDialogSettings :one
SELECT * FROM dialog_settings
WHERE dialog_id = $1
LIMIT 1;

-- name: UpdateDialogMemberRole :exec
UPDATE dialog_members
SET role = $3, updated_at = NOW()
WHERE dialog_id = $1 AND user_id = $2;

-- name: UpdateDialogSettings :exec
UPDATE dialog_settings
SET permissions = $2, updated_at = NOW()
WHERE dialog_id = $1;

-- name: FindNewDialogOwner :one
SELECT user_id FROM dialog_members
WHERE dialog_id = $1 AND user_id != $2
ORDER BY
    CASE WHEN role = 'admin' THEN 0 ELSE 1 END ASC,
    joined_at ASC
LIMIT 1;

-- name: UpdateDialogCreator :exec
UPDATE dialogs
SET creator_id = $2, updated_at = NOW()
WHERE id = $1;

-- name: CountDialogAdmins :one
SELECT COUNT(*) FROM dialog_members
WHERE dialog_id = $1 AND role = 'admin';

-- name: SearchPublicDialogs :many
SELECT
    d.id, d.type, d.name, d.username, d.photo_url, d.description,
    d.members_count, d.is_verified, d.is_active, d.created_at, d.updated_at,
    COALESCE(dm.role, 'NONE')::text as user_role
FROM dialogs d
LEFT JOIN dialog_members dm ON d.id = dm.dialog_id AND dm.user_id = $2
WHERE (d.name ILIKE '%' || $1 || '%' OR d.username ILIKE '%' || $1 || '%')
    AND d.type IN ('group', 'channel')
    AND d.username IS NOT NULL
    AND d.is_active = true
    AND d.deleted_at IS NULL
LIMIT 20;

-- name: GetDialogOpponent :one
SELECT
    u.id as user_id,
    u.username,
    u.first_name,
    u.last_name,
    u.photo_url,
    u.is_bot,
    dm.last_read_sequence
FROM users u
JOIN dialog_members dm ON u.id = dm.user_id
WHERE dm.dialog_id = $1 AND dm.user_id != $2
LIMIT 1;

-- name: UpdateChatMetadata :one
UPDATE dialogs
SET
    name = COALESCE(sqlc.narg('name'), name),
    username = CASE
        WHEN sqlc.arg('update_slug')::boolean THEN sqlc.narg('username')
        ELSE username
    END,
    description = COALESCE(sqlc.narg('description'), description),
    photo_url = COALESCE(sqlc.narg('photo_url'), photo_url),
    updated_at = NOW()
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: IncrementMembersCount :exec
UPDATE dialogs
SET members_count = (SELECT COUNT(*) FROM dialog_members WHERE dialog_id = $1),
    updated_at = NOW()
WHERE id = $1;

-- name: DecrementMembersCount :exec
UPDATE dialogs
SET members_count = (SELECT COUNT(*) FROM dialog_members WHERE dialog_id = $1),
    updated_at = NOW()
WHERE id = $1;

-- name: CanDeletePrivateDialog :one
SELECT EXISTS (
    SELECT 1 FROM dialogs d
    JOIN dialog_members dm ON d.id = dm.dialog_id
    WHERE d.id = $1
      AND dm.user_id = $2
      AND d.type = 'private'
      AND d.deleted_at IS NULL
);
