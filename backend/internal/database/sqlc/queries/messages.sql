-- name: CreateMessage :one
INSERT INTO messages (
    id, dialog_id, author_id, content, is_encrypted,
    encryption_iv, reply_to_id, is_system, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
) RETURNING *;

-- name: GetMessageByID :one
SELECT * FROM messages WHERE id = $1 LIMIT 1;

-- name: GetChatHistory :many
SELECT * FROM messages
WHERE dialog_id = $1 AND is_deleted = false
ORDER BY sequence DESC
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
WHERE dialog_id = $1 AND user_id = $2;

-- name: CountUnreadMessages :one
SELECT count(*) FROM messages
WHERE dialog_id = $1 AND author_id != $2 AND sequence > $3;
