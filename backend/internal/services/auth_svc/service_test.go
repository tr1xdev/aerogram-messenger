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
	authpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/auth/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/models"
	"github.com/tr1xdev/aerogram-messenger/internal/testutils"
)

func ptr[T any](v T) *T {
	return &v
}

func setupTest(t *testing.T) (*Server, *miniredis.Miniredis) {
	os.Setenv("JWT_SECRET", "test_secret_123")
	os.Setenv("APP_ENV", "development")

	_, filename, _, _ := runtime.Caller(0)
	dir := filepath.Join(filepath.Dir(filename), "../../../..")
	err := os.Chdir(dir)
	require.NoError(t, err)

	db := testutils.SetupTestDB(t)
	err = db.AutoMigrate(&models.User{}, &models.Session{}, &models.RefreshToken{})
	require.NoError(t, err)

	mr, err := miniredis.Run()
	require.NoError(t, err)

	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	cfg := &config.Config{
		App: config.AppConfig{Env: "development"},
		JWT: config.JWTConfig{Secret: "test_secret_123", TTLMinutes: 60},
	}

	return NewServer(db, rdb, cfg), mr
}

func TestAuthServer(t *testing.T) {
	server, mr := setupTest(t)
	defer mr.Close()
	ctx := context.Background()

	t.Run("SignUp_Success", func(t *testing.T) {
		req := &authpb.SignUpRequest{
			Email:     "success@test.com",
			FirstName: "Ivan",
			LastName:  ptr("Ivanov"),
			Password:  "secret123",
		}
		res, err := server.SignUp(ctx, req)
		require.NoError(t, err)
		assert.NotEmpty(t, res.UserId)
	})

	t.Run("Full_Auth_Flow", func(t *testing.T) {
		email := "flow_unique@test.com"
		password := "password123"

		sRes, err := server.SignUp(ctx, &authpb.SignUpRequest{
			Email:     email,
			FirstName: "Flow",
			Password:  password,
			Username:  ptr("flow_user"),
		})
		require.NoError(t, err)

		code, err := server.authRepo.GetCodeForTest(ctx, sRes.UserId)
		require.NoError(t, err)

		vRes, err := server.VerifyEmail(ctx, &authpb.VerifyEmailRequest{
			UserId: sRes.UserId,
			Code:   code,
		})
		require.NoError(t, err)
		assert.NotEmpty(t, vRes.AccessToken)
	})

	t.Run("RefreshToken_Success", func(t *testing.T) {
		email := "refresh_unique@test.com"
		sRes, err := server.SignUp(ctx, &authpb.SignUpRequest{
			Email: email, FirstName: "Ref", Password: "P",
		})
		require.NoError(t, err)

		code, _ := server.authRepo.GetCodeForTest(ctx, sRes.UserId)
		vRes, _ := server.VerifyEmail(ctx, &authpb.VerifyEmailRequest{
			UserId: sRes.UserId, Code: code,
		})

		refreshRes, err := server.RefreshToken(ctx, &authpb.RefreshTokenRequest{
			RefreshToken: vRes.RefreshToken,
		})
		require.NoError(t, err)
		assert.NotEqual(t, vRes.RefreshToken, refreshRes.RefreshToken)
	})

	t.Run("GetUser_Success", func(t *testing.T) {
		userID := "user_static_id"
		server.db.Create(&models.User{
			ID:        userID,
			Email:     "static@test.com",
			FirstName: "John",
			Username:  ptr("johnny_static"),
			LastName:  ptr("Doe"),
		})

		res, err := server.GetUser(ctx, &authpb.GetUserRequest{UserId: userID})
		require.NoError(t, err)
		assert.Equal(t, "johnny_static", *res.Username)
		assert.Equal(t, "Doe", *res.LastName)
	})
}
