-- name: CreateMessage :one
INSERT INTO messages (
    id, dialog_id, author_id, content, is_encrypted,
    encryption_iv, reply_to_id, is_system, is_deleted, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, false, NOW(), NOW()
) RETURNING *;

-- name: GetMessageByID :one
SELECT * FROM messages WHERE id = $1 LIMIT 1;

-- name: GetChatHistory :many
SELECT
    m.*,
    u.id as author_id,
    u.username as author_username,
    u.first_name as author_first_name,
    u.last_name as author_last_name,
    u.public_key as author_public_key,
    u.photo_url as author_photo_url -- This will now work
FROM messages m
JOIN users u ON m.author_id = u.id
WHERE m.dialog_id = $1 AND m.is_deleted = false
ORDER BY m.sequence DESC
LIMIT $2 OFFSET $3;

-- name: UpdateMessageContent :one
UPDATE messages
SET content = $2, is_edited = true, updated_at = NOW()
WHERE id = $1 AND author_id = $3
RETURNING *;

-- name: SoftDeleteMessage :exec
UPDATE messages
SET is_deleted = true, updated_at = NOW()
WHERE id = $1 AND author_id = $2;

-- name: UpdateDialogLastMessage :exec
UPDATE dialogs
SET last_message_id = $2,
    last_message_at = $3,
    updated_at = NOW()
WHERE id = $1;

-- name: UpdateMemberReadSequence :exec
UPDATE dialog_members
SET last_read_sequence = $3, updated_at = NOW()
WHERE dialog_id = $1 AND user_id = $2 AND last_read_sequence < $3;

-- name: CountUnreadMessages :one
SELECT count(*) FROM messages
WHERE dialog_id = $1 AND author_id != $2 AND sequence > $3;

-- name: GetLastSequence :one
SELECT COALESCE(MAX(sequence), 0)::BIGINT FROM messages
WHERE dialog_id = $1;

-- name: MarkAllAsRead :exec
UPDATE dialog_members
SET last_read_sequence = (
    SELECT COALESCE(MAX(m.sequence), 0)
    FROM messages m
    WHERE m.dialog_id = dialog_members.dialog_id
), updated_at = NOW()
WHERE dialog_members.dialog_id = $1 AND dialog_members.user_id = $2;

-- name: GetMessageBySequence :one
SELECT * FROM messages
WHERE dialog_id = $1 AND sequence = $2 LIMIT 1;

-- name: GetLastChatMessage :one
SELECT * FROM messages
WHERE dialog_id = $1 AND is_deleted = false
ORDER BY sequence DESC
LIMIT 1;

-- name: GetMessagesByIDs :many
SELECT * FROM messages WHERE id = ANY($1::uuid[]);

-- name: UpdateMessageExtended :one
UPDATE messages
SET content = $2,
    encryption_iv = $3,
    is_edited = true,
    updated_at = NOW()
WHERE id = $1 AND author_id = $4
RETURNING *;
