package repositories

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
)

var (
	ErrCodeInvalid     = errors.New("invalid verification code")
	ErrCodeExpired     = errors.New("verification code expired")
	ErrTooManyAttempts = errors.New("too many attempts")
)

type EmailProvider interface {
	SendCode(ctx context.Context, to, code, name string) error
}

type AuthRepository struct {
	db      *database.DB
	rdb     *redis.Client
	mailer  EmailProvider
	codeTTL time.Duration
}

func NewAuthRepository(db *database.DB, rdb *redis.Client, mailer EmailProvider, ttl time.Duration) *AuthRepository {
	return &AuthRepository{db: db, rdb: rdb, mailer: mailer, codeTTL: ttl}
}

func (r *AuthRepository) StoreAndSendCode(ctx context.Context, verID, userID, email, name string) error {
	num, _ := rand.Int(rand.Reader, big.NewInt(1000000))
	code := fmt.Sprintf("%06d", num.Int64())

	fmt.Printf("DEBUG: Verification code for %s is %s\n", email, code)

	sum := sha256.Sum256([]byte(code))
	hash := hex.EncodeToString(sum[:])
	key := "auth:verify:" + verID

	err := r.rdb.HSet(ctx, key, map[string]interface{}{
		"hash":     hash,
		"user_id":  userID,
		"attempts": 0,
	}).Err()

	if err != nil {
		return err
	}
	r.rdb.Expire(ctx, key, r.codeTTL)

	return r.mailer.SendCode(ctx, email, code, name)
}

func (r *AuthRepository) VerifyCode(ctx context.Context, verID, code string) (string, error) {
	key := "auth:verify:" + verID
	data, err := r.rdb.HGetAll(ctx, key).Result()
	if err != nil || len(data) == 0 {
		return "", ErrCodeExpired
	}

	var attempts int
	_, _ = fmt.Sscanf(data["attempts"], "%d", &attempts)
	if attempts >= 5 {
		r.rdb.Del(ctx, key)
		return "", ErrTooManyAttempts
	}

	sum := sha256.Sum256([]byte(code))
	if subtle.ConstantTimeCompare([]byte(data["hash"]), []byte(hex.EncodeToString(sum[:]))) != 1 {
		r.rdb.HIncrBy(ctx, key, "attempts", 1)
		return "", ErrCodeInvalid
	}

	r.rdb.Del(ctx, key)
	return data["user_id"], nil
}
