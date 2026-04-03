package user_svc

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/tr1xdev/aerogram-messenger/internal/config"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	errorspb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/errors/v1"
	userpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/user/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type mockLimiter struct {
	shouldFail bool
}

func (m *mockLimiter) Check(ctx context.Context, key string, limit int, window time.Duration) error {
	if m.shouldFail {
		return status.Error(codes.ResourceExhausted, "limit exceeded")
	}
	return nil
}

func (m *mockLimiter) Allow(ctx context.Context, key string, limit int, window time.Duration) (bool, error) {
	if m.shouldFail {
		return false, nil
	}
	return true, nil
}

const testPassword = "secure_password_123"

func setupUserTest(t *testing.T) (*Server, context.Context, *mockLimiter) {
	t.Helper()
	db := database.SetupTestDB(t)

	cfg := &config.Config{
		RateLimit: config.RateLimitConfig{
			User: config.UserLimitConfig{
				Update:    config.LimitEntry{Limit: 100, Window: time.Minute},
				Search:    config.LimitEntry{Limit: 100, Window: time.Minute},
				CreateBot: config.LimitEntry{Limit: 100, Window: time.Minute},
			},
		},
		UserService: config.UserServiceConfig{
			MaxBotsPerUser: 2,
		},
	}

	l := &mockLimiter{}
	srv := NewServer(db, l, cfg)

	ctx := metadata.NewIncomingContext(context.Background(), metadata.Pairs("user-id", uuid.New().String()))
	return srv, ctx, l
}

func TestUserInfo(t *testing.T) {
	server, ctx, _ := setupUserTest(t)
	userID := uuid.New()

	_, err := server.userRepo.CreateUser(ctx, dbgen.CreateUserParams{
		ID:        userID,
		Username:  sql.NullString{String: "test_user", Valid: true},
		FirstName: "Test",
		Email:     sql.NullString{String: "test@test.com", Valid: true},
		Password:  sql.NullString{String: testPassword, Valid: true},
	})
	require.NoError(t, err)

	t.Run("success_by_id", func(t *testing.T) {
		req := &userpb.UserInfoRequest{
			Identifier: &userpb.UserInfoRequest_Id{Id: userID.String()},
		}
		resp, err := server.UserInfo(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, resp.GetUser())
		assert.Equal(t, userID.String(), resp.GetUser().Id)
	})

	t.Run("not_found", func(t *testing.T) {
		req := &userpb.UserInfoRequest{
			Identifier: &userpb.UserInfoRequest_Id{Id: uuid.New().String()},
		}
		resp, err := server.UserInfo(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, resp.GetError())
		assert.Equal(t, errorspb.ErrorCode_ERROR_CODE_NOT_FOUND, *resp.GetError().Code)
	})
}

func TestUpdateUser(t *testing.T) {
	server, ctx, limiter := setupUserTest(t)
	userID := uuid.New()

	_, err := server.userRepo.CreateUser(ctx, dbgen.CreateUserParams{
		ID:        userID,
		FirstName: "Original",
		Password:  sql.NullString{String: testPassword, Valid: true},
	})
	require.NoError(t, err)

	t.Run("success_update", func(t *testing.T) {
		newName := "Updated"
		req := &userpb.UpdateUserRequest{
			Id:        userID.String(),
			FirstName: &newName,
		}
		resp, err := server.UpdateUser(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, resp.GetUser())
		assert.Equal(t, newName, resp.GetUser().FirstName)
	})

	t.Run("rate_limit_exceeded", func(t *testing.T) {
		limiter.shouldFail = true
		defer func() { limiter.shouldFail = false }()

		req := &userpb.UpdateUserRequest{Id: userID.String()}
		_, err := server.UpdateUser(ctx, req)
		assert.Error(t, err)
		assert.Equal(t, codes.ResourceExhausted, status.Code(err))
	})
}

func TestCreateBot(t *testing.T) {
	server, ctx, _ := setupUserTest(t)
	ownerID := uuid.New()

	_, err := server.userRepo.CreateUser(ctx, dbgen.CreateUserParams{
		ID:        ownerID,
		FirstName: "Owner",
		Password:  sql.NullString{String: testPassword, Valid: true},
	})
	require.NoError(t, err)

	t.Run("success_creation", func(t *testing.T) {
		req := &userpb.CreateBotRequest{
			OwnerId:   ownerID.String(),
			Username:  "my_bot",
			FirstName: "Bot",
		}
		resp, err := server.CreateBot(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, resp.GetUser())
		assert.True(t, resp.GetUser().IsBot)
		assert.Equal(t, ownerID.String(), *resp.GetUser().BotOwnerId)
	})

	t.Run("quota_exceeded", func(t *testing.T) {
		// В конфиге MaxBotsPerUser = 2. Первый уже создан.
		req2 := &userpb.CreateBotRequest{
			OwnerId:   ownerID.String(),
			Username:  "bot2",
			FirstName: "Bot2",
		}
		_, err := server.CreateBot(ctx, req2)
		require.NoError(t, err)

		req3 := &userpb.CreateBotRequest{
			OwnerId:   ownerID.String(),
			Username:  "bot3",
			FirstName: "Bot3",
		}
		_, err = server.CreateBot(ctx, req3)
		assert.Error(t, err)
		assert.Equal(t, codes.FailedPrecondition, status.Code(err))
	})
}

func TestSearchUsers(t *testing.T) {
	server, ctx, _ := setupUserTest(t)

	_, err := server.userRepo.CreateUser(ctx, dbgen.CreateUserParams{
		ID:        uuid.New(),
		Username:  sql.NullString{String: "alex_dev", Valid: true},
		FirstName: "Alex",
		Password:  sql.NullString{String: testPassword, Valid: true},
	})
	require.NoError(t, err)

	t.Run("global_search", func(t *testing.T) {
		req := &userpb.SearchUsersRequest{
			Query:  "alex",
			Global: true,
		}
		resp, err := server.SearchUsers(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, resp)
		assert.NotEmpty(t, resp.Users)
		assert.Equal(t, "alex_dev", *resp.Users[0].Username)
	})
}

func TestGetUsers(t *testing.T) {
	server, ctx, _ := setupUserTest(t)
	id1, id2 := uuid.New(), uuid.New()

	for _, id := range []uuid.UUID{id1, id2} {
		_, err := server.userRepo.CreateUser(ctx, dbgen.CreateUserParams{
			ID:        id,
			FirstName: fmt.Sprintf("User-%s", id.String()[:4]),
			Password:  sql.NullString{String: testPassword, Valid: true},
		})
		require.NoError(t, err)
	}

	req := &userpb.GetUsersRequest{
		Ids: []string{id1.String(), id2.String(), "invalid-uuid"},
	}
	resp, err := server.GetUsers(ctx, req)
	require.NoError(t, err)
	require.NotNil(t, resp)
	assert.Len(t, resp.Users, 2)
}
