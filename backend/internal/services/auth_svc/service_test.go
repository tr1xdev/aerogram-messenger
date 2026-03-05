package auth_svc

import (
	"context"
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/tr1xdev/aerogram-messenger/internal/config"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	authpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/auth/v1"
)

type mockMailer struct{}

func (m *mockMailer) SendCode(ctx context.Context, to, code, name string) error { return nil }

func setupTest(t *testing.T) (*Server, *miniredis.Miniredis) {
	os.Setenv("JWT_SECRET", "test_secret_123")
	os.Setenv("APP_ENV", "development")

	_, filename, _, _ := runtime.Caller(0)
	dir := filepath.Join(filepath.Dir(filename), "../../../..")
	_ = os.Chdir(dir)

	sqlDB := database.SetupTestDB(t)
	mr, _ := miniredis.Run()
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})

	cfg := &config.Config{
		App: config.AppConfig{Env: "development"},
		JWT: config.JWTConfig{Secret: "test_secret_123", TTLMinutes: 60},
	}

	return NewServer(sqlDB, rdb, &mockMailer{}, cfg), mr
}

func TestAuthServer(t *testing.T) {
	server, mr := setupTest(t)
	defer mr.Close()
	ctx := context.Background()

	t.Run("SignUp_Success", func(t *testing.T) {
		req := &authpb.SignUpRequest{
			Email:     "success@test.com",
			FirstName: "Ivan",
			Password:  "secret123",
		}
		res, err := server.SignUp(ctx, req)
		require.NoError(t, err)
		assert.NotEmpty(t, res.UserId)
	})
}
