package auth_svc

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/tr1xdev/aerogram-messenger/internal/config"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	authpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/auth/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/infrastructure/limiter"
)

type mockMailer struct{}

func (m *mockMailer) SendCode(ctx context.Context, to string, code string, name string) error {
	return nil
}

func setupTest(t *testing.T, twoFAEnabled bool, onSignUp bool, onSignIn bool) *Server {
	t.Helper()

	os.Setenv("DB_USER", "admin")
	os.Setenv("POSTGRES_PASSWORD", "admin")
	os.Setenv("DB_NAME", "aerogram_test")
	os.Setenv("JWT_SECRET", "test_secret_123")
	os.Setenv("APP_ENV", "development")

	_, filename, _, _ := runtime.Caller(0)
	oldDir, _ := os.Getwd()
	dir := filepath.Join(filepath.Dir(filename), "../../../..")
	_ = os.Chdir(dir)

	t.Cleanup(func() {
		_ = os.Chdir(oldDir)
	})

	sqlDB := database.SetupTestDB(t)
	mr, err := miniredis.Run()
	require.NoError(t, err)

	rdb := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})

	t.Cleanup(func() {
		_ = rdb.Close()
		mr.Close()
	})

	authLimiter := limiter.NewRedisLimiter(rdb)

	cfg := &config.Config{
		App: config.AppConfig{
			Env: "development",
		},
		Auth: config.AuthConfig{
			JWT: config.JWTConfig{
				Secret:    "test_secret_123",
				AccessTTL: 60 * time.Minute,
			},
			TwoFA: config.TwoFAConfig{
				Enabled:  twoFAEnabled,
				OnSignUp: onSignUp,
				OnSignIn: onSignIn,
				CodeTTL:  10 * time.Minute,
			},
		},
		RateLimit: config.RateLimitConfig{
			Auth: config.AuthLimitConfig{
				SignUp: config.LimitEntry{Limit: 1000, Window: time.Hour},
				Login:  config.LimitEntry{Limit: 1000, Window: time.Hour},
				Verify: config.LimitEntry{Limit: 1000, Window: time.Hour},
			},
		},
	}

	return NewServer(sqlDB, authLimiter, rdb, &mockMailer{}, cfg)
}

func TestAuthServer_SignUp(t *testing.T) {
	ctx := context.Background()

	t.Run("SignUp_2FA_Disabled_Returns_Tokens", func(t *testing.T) {
		server := setupTest(t, false, false, false)

		req := &authpb.SignUpRequest{
			Email:     "no2fa@test.com",
			FirstName: "Ivan",
			Password:  "secret123",
		}
		res, err := server.SignUp(ctx, req)
		require.NoError(t, err)
		assert.NotEmpty(t, res.UserId)
		assert.NotNil(t, res.AccessToken)
		assert.NotNil(t, res.RefreshToken)
	})

	t.Run("SignUp_2FA_Enabled_Returns_No_Tokens", func(t *testing.T) {
		server := setupTest(t, true, true, false)

		req := &authpb.SignUpRequest{
			Email:     "2fa@test.com",
			FirstName: "Ivan",
			Password:  "secret123",
		}
		res, err := server.SignUp(ctx, req)
		require.NoError(t, err)
		assert.NotEmpty(t, res.UserId)
		assert.Nil(t, res.AccessToken)
		assert.Nil(t, res.RefreshToken)
	})
}

func TestAuthServer_Login(t *testing.T) {
	ctx := context.Background()

	t.Run("Login_2FA_Disabled_Returns_Tokens", func(t *testing.T) {
		server := setupTest(t, false, false, false)

		email := "login_no2fa@test.com"
		password := "password123"

		_, err := server.SignUp(ctx, &authpb.SignUpRequest{
			Email: email, FirstName: "Test", Password: password,
		})
		require.NoError(t, err)

		res, err := server.Login(ctx, &authpb.LoginRequest{
			Email: email, Password: password,
		})
		require.NoError(t, err)
		assert.NotNil(t, res.AccessToken)
	})

	t.Run("Login_2FA_Enabled_Returns_No_Tokens", func(t *testing.T) {
		server := setupTest(t, true, false, true)

		email := "login_2fa@test.com"
		password := "password123"

		_, err := server.SignUp(ctx, &authpb.SignUpRequest{
			Email: email, FirstName: "Test", Password: password,
		})
		require.NoError(t, err)

		res, err := server.Login(ctx, &authpb.LoginRequest{
			Email: email, Password: password,
		})
		require.NoError(t, err)
		assert.Nil(t, res.AccessToken)
	})
}
