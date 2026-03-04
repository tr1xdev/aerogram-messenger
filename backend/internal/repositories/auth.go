package repositories

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"html/template"
	"math/big"
	"os"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/resend/resend-go/v3"
)

var (
	ErrCodeInvalid     = errors.New("invalid verification code")
	ErrCodeExpired     = errors.New("verification code expired")
	ErrTooManyAttempts = errors.New("too many attempts")
	ErrResendCooldown  = errors.New("resend cooldown active")
)

type AuthRepository struct {
	rdb       *redis.Client
	resend    *resend.Client
	codeTTL   time.Duration
	resendTTL time.Duration
}

func NewAuthRepository(rdb *redis.Client, resendKey string) *AuthRepository {
	return &AuthRepository{
		rdb:       rdb,
		resend:    resend.NewClient(resendKey),
		codeTTL:   15 * time.Minute,
		resendTTL: 60 * time.Second,
	}
}

func (r *AuthRepository) codeKey(verificationID string) string {
	return "auth:verify:" + verificationID
}

func (r *AuthRepository) generateCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func (r *AuthRepository) StoreAndSendCode(ctx context.Context, verificationID, userID, email, firstName string) error {
	code, err := r.generateCode()
	if err != nil {
		return err
	}

	env := os.Getenv("APP_ENV")
	testEmail := os.Getenv("TEST_EMAIL")

	if env == "development" {
		fmt.Printf("=== [DEV MODE] Code for %s: %s (VerifID: %s)\n", email, code, verificationID)
	}

	sum := sha256.Sum256([]byte(code))
	hash := hex.EncodeToString(sum[:])

	pipe := r.rdb.TxPipeline()
	key := r.codeKey(verificationID)
	pipe.HSet(ctx, key, "hash", hash, "user_id", userID, "attempts", 0)
	pipe.Expire(ctx, key, r.codeTTL)

	if _, err := pipe.Exec(ctx); err != nil {
		return err
	}

	if env == "development" && (os.Getenv("RESEND_TOKEN") == "" || os.Getenv("RESEND_TOKEN") == "test") {
		return nil
	}

	templatePath := "internal/templates/verification.html"
	if _, err := os.Stat(templatePath); os.IsNotExist(err) {
		return fmt.Errorf("verification template not found at %s", templatePath)
	}

	tmpl, err := template.ParseFiles(templatePath)
	if err != nil {
		return err
	}

	var body bytes.Buffer
	data := struct {
		FirstName string
		Code      string
	}{
		FirstName: firstName,
		Code:      code,
	}

	if err := tmpl.Execute(&body, data); err != nil {
		return err
	}

	targetEmail := email
	if env == "development" && testEmail != "" {
		targetEmail = testEmail
	}

	from := os.Getenv("RESEND_FROM")
	if from == "" {
		from = "onboarding@resend.dev"
	}

	_, err = r.resend.Emails.Send(&resend.SendEmailRequest{
		From:    from,
		To:      []string{targetEmail},
		Subject: fmt.Sprintf("%s is your verification code", code),
		Html:    body.String(),
	})

	return err
}

func (r *AuthRepository) VerifyCode(ctx context.Context, verificationID, code string) (string, error) {
	key := r.codeKey(verificationID)

	data, err := r.rdb.HGetAll(ctx, key).Result()
	if err != nil || len(data) == 0 {
		return "", ErrCodeExpired
	}

	attempts, _ := strconv.Atoi(data["attempts"])
	if attempts >= 5 {
		r.rdb.Del(ctx, key)
		return "", ErrTooManyAttempts
	}

	sum := sha256.Sum256([]byte(code))
	if !secureCompare(data["hash"], hex.EncodeToString(sum[:])) {
		r.rdb.HIncrBy(ctx, key, "attempts", 1)
		return "", ErrCodeInvalid
	}

	r.rdb.Del(ctx, key)

	return data["user_id"], nil
}

func secureCompare(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	var r byte
	for i := range a {
		r |= a[i] ^ b[i]
	}
	return r == 0
}

func (r *AuthRepository) GetCodeForTest(ctx context.Context, verificationID string) (string, error) {
	key := r.codeKey(verificationID)

	code := "123456"
	sum := sha256.Sum256([]byte(code))
	hash := hex.EncodeToString(sum[:])

	err := r.rdb.HSet(ctx, key, "hash", hash).Err()
	return code, err
}
