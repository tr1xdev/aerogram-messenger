-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 AND deleted_at IS NULL LIMIT 1;

-- name: GetUserByEmail :one
SELECT * from users
WHERE email = $1 AND deleted_at IS NULL LIMIT 1;

-- name: CreateUser :one
INSERT INTO users (
    id,
    username,
    first_name,
    last_name,
    email,
    password,
    status,
    public_key,
    encrypted_priv_key,
    encryption_iv
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
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

-- name: SearchUsersByUsername :many
SELECT * FROM users
WHERE username ILIKE $1 || '%' AND username != '' AND deleted_at IS NULL
LIMIT 20;

-- name: SearchUsersGlobal :many
SELECT * FROM users
WHERE (username ILIKE '%' || $1 || '%' OR first_name ILIKE '%' || $1 || '%')
AND deleted_at IS NULL
LIMIT 20;

-- name: CheckUserExists :one
SELECT EXISTS(SELECT 1 FROM users WHERE id = $1);
