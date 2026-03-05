-- name: GetActiveSession :one
SELECT * FROM sessions
WHERE id = $1
  AND (user_id = $2 OR $2 = '00000000-0000-0000-0000-000000000000')
  AND is_active = true
LIMIT 1;

-- name: CreateSession :one
INSERT INTO sessions (
    id, user_id, ip_address, device, is_active, created_at
) VALUES (
    $1, $2, $3, $4, true, NOW()
) RETURNING *;

-- name: DeactivateSession :exec
UPDATE sessions
SET is_active = false
WHERE id = $1;

-- name: DeactivateAllUserSessions :exec
UPDATE sessions
SET is_active = false
WHERE user_id = $1;

-- name: GetSessionByID :one
SELECT * FROM sessions
WHERE id = $1 AND is_active = true
LIMIT 1;

-- name: UpdateSessionActivity :exec
UPDATE sessions
SET is_active = true
WHERE id = $1;

-- name: GetSessionsByUserID :many
SELECT * FROM sessions
WHERE user_id = $1 AND is_active = true
ORDER BY created_at DESC;
