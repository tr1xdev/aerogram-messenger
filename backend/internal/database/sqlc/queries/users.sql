-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 AND deleted_at IS NULL LIMIT 1;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 AND deleted_at IS NULL LIMIT 1;

-- name: GetUserByBotToken :one
SELECT * FROM users
WHERE bot_token_hash = $1 AND is_bot = TRUE AND deleted_at IS NULL LIMIT 1;

-- name: CreateUser :one
INSERT INTO users (
    id, username, first_name, last_name, email, password,
    status, public_key, encrypted_priv_key, encryption_iv,
    photo_url, is_bot, bot_token_hash, bot_owner_id, bot_description, bot_commands,
    created_at, updated_at, is_premium, is_email_verified, is_verified
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
    $11, $12, $13, $14, $15, $16,
    NOW(), NOW(), DEFAULT, DEFAULT, DEFAULT
)
RETURNING *;

-- name: CreateBot :one
INSERT INTO users (
    id, username, first_name, last_name, is_bot, bot_token_hash,
    bot_owner_id, bot_description, bot_commands, status,
    created_at, updated_at
) VALUES (
    $1, $2, $3, $4, TRUE, $5, $6, $7, $8, 'ONLINE',
    NOW(), NOW()
)
RETURNING *;

-- name: UpdateUserStatus :exec
UPDATE users
SET status = $2, updated_at = NOW()
WHERE id = $1;

-- name: SoftDeleteUser :exec
UPDATE users
SET deleted_at = NOW()
WHERE id = $1;

-- name: GetUsersByIDs :many
SELECT * FROM users
WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL;

-- name: GetBotsByOwnerID :many
SELECT * FROM users
WHERE bot_owner_id = $1 AND is_bot = TRUE AND deleted_at IS NULL;

-- name: CountBotsByOwnerID :one
SELECT COUNT(*) FROM users
WHERE bot_owner_id = $1 AND is_bot = TRUE AND deleted_at IS NULL;

-- name: SearchUsersByUsername :many
SELECT * FROM users
WHERE username ILIKE $1::text || '%' AND username != '' AND deleted_at IS NULL
LIMIT 20;

-- name: SearchUsersGlobal :many
SELECT * FROM users
WHERE (username ILIKE '%' || $1 || '%' OR first_name ILIKE '%' || $1 || '%')
AND deleted_at IS NULL
LIMIT 20;

-- name: CheckUserExists :one
SELECT EXISTS(SELECT 1 FROM users WHERE id = $1);

-- name: UpdateUser :one
UPDATE users
SET
    first_name = COALESCE(sqlc.narg('first_name'), first_name),
    last_name = COALESCE(sqlc.narg('last_name'), last_name),
    username = COALESCE(sqlc.narg('username'), username),
    public_key = COALESCE(sqlc.narg('public_key'), public_key),
    encrypted_priv_key = COALESCE(sqlc.narg('encrypted_priv_key'), encrypted_priv_key),
    encryption_iv = COALESCE(sqlc.narg('encryption_iv'), encryption_iv),
    photo_url = COALESCE(sqlc.narg('photo_url'), photo_url),
    is_verified = COALESCE(sqlc.narg('is_verified'), is_verified),
    bot_description = COALESCE(sqlc.narg('bot_description'), bot_description),
    bot_commands = COALESCE(sqlc.narg('bot_commands'), bot_commands),
    updated_at = NOW()
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: GetUserByUsername :one
SELECT * FROM users
WHERE username = $1 AND deleted_at IS NULL LIMIT 1;

-- name: UpdateBot :one
UPDATE users
SET
    first_name = COALESCE(sqlc.narg('first_name'), first_name),
    last_name = COALESCE(sqlc.narg('last_name'), last_name),
    username = COALESCE(sqlc.narg('username'), username),
    public_key = COALESCE(sqlc.narg('public_key'), public_key),
    encrypted_priv_key = COALESCE(sqlc.narg('encrypted_priv_key'), encrypted_priv_key),
    encryption_iv = COALESCE(sqlc.narg('encryption_iv'), encryption_iv),
    photo_url = COALESCE(sqlc.narg('photo_url'), photo_url),
    bot_description = COALESCE(sqlc.narg('bot_description'), bot_description),
    bot_commands = COALESCE(sqlc.narg('bot_commands'), bot_commands)
WHERE id = $1 AND bot_owner_id = $2
RETURNING *;

-- name: DeleteBot :exec
DELETE FROM users
WHERE id = $1 AND bot_owner_id = $2;
