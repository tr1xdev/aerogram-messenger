package user_svc

import (
	"context"
	"database/sql"
	"os"
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
)

var testDB *database.DB

type mockLimiter struct{}

func (m *mockLimiter) Check(ctx context.Context, key string, limit int, window time.Duration) error {
	return nil
}

func (m *mockLimiter) Allow(ctx context.Context, key string, limit int, window time.Duration) (bool, error) {
	return true, nil
}

func TestMain(m *testing.M) {
	db, cleanup := database.SetupGlobalTestDB()
	testDB = db

	code := m.Run()

	cleanup()
	os.Exit(code)
}

func setupUserTest(t *testing.T) (*Server, context.Context) {
	t.Helper()
	testDB.TruncateTables(t)

	cfg := &config.Config{
		RateLimit: config.RateLimitConfig{
			User: config.UserLimitConfig{
				Update:    config.LimitEntry{Limit: 100, Window: time.Minute},
				Search:    config.LimitEntry{Limit: 100, Window: time.Minute},
				CreateBot: config.LimitEntry{Limit: 100, Window: time.Minute},
			},
		},
		UserService: config.UserServiceConfig{
			MaxBotsPerUser: 20,
		},
	}

	return NewServer(testDB, &mockLimiter{}, cfg), context.Background()
}

func TestUserInfo(t *testing.T) {
	server, ctx := setupUserTest(t)
	userID := uuid.New()
	username := "alice_hub"

	_, err := server.userRepo.CreateUser(ctx, dbgen.CreateUserParams{
		ID:        userID,
		Username:  sql.NullString{String: username, Valid: true},
		FirstName: "Alice",
		Email:     sql.NullString{String: "alice@test.com", Valid: true},
		Password:  sql.NullString{String: "hash", Valid: true},
		Status:    "online",
	})
	require.NoError(t, err)

	t.Run("success_by_id", func(t *testing.T) {
		req := &userpb.UserInfoRequest{
			Identifier: &userpb.UserInfoRequest_Id{Id: userID.String()},
		}
		resp, err := server.UserInfo(ctx, req)

		assert.NoError(t, err)
		require.NotNil(t, resp.GetUser())
		assert.Equal(t, "Alice", resp.GetUser().FirstName)
		assert.Equal(t, username, *resp.GetUser().Username)
	})

	t.Run("not_found", func(t *testing.T) {
		req := &userpb.UserInfoRequest{
			Identifier: &userpb.UserInfoRequest_Id{Id: uuid.New().String()},
		}
		resp, err := server.UserInfo(ctx, req)

		assert.NoError(t, err)
		require.NotNil(t, resp.GetError())
		assert.Equal(t, errorspb.ErrorCode_ERROR_CODE_NOT_FOUND, *resp.GetError().Code)
	})
}

func TestUpdateUser(t *testing.T) {
	server, ctx := setupUserTest(t)
	userID := uuid.New()

	_, err := server.userRepo.CreateUser(ctx, dbgen.CreateUserParams{
		ID:        userID,
		FirstName: "OldName",
		Email:     sql.NullString{String: "update@test.com", Valid: true},
		Password:  sql.NullString{String: "hash", Valid: true},
		Status:    "online",
	})
	require.NoError(t, err)

	t.Run("partial_update_success", func(t *testing.T) {
		newName := "NewName"
		req := &userpb.UpdateUserRequest{
			Id:        userID.String(),
			FirstName: &newName,
		}

		resp, err := server.UpdateUser(ctx, req)
		assert.NoError(t, err)
		require.NotNil(t, resp.GetUser())
		assert.Equal(t, newName, resp.GetUser().FirstName)

		updated, err := server.userRepo.GetByID(ctx, userID)
		assert.NoError(t, err)
		assert.Equal(t, newName, updated.FirstName)
	})
}

func TestGetUsers(t *testing.T) {
	server, ctx := setupUserTest(t)
	u1, u2 := uuid.New(), uuid.New()

	_, _ = server.userRepo.CreateUser(ctx, dbgen.CreateUserParams{
		ID:        u1,
		FirstName: "User1",
		Email:     sql.NullString{String: "u1@test.com", Valid: true},
		Password:  sql.NullString{String: "p", Valid: true},
		Status:    "s",
	})
	_, _ = server.userRepo.CreateUser(ctx, dbgen.CreateUserParams{
		ID:        u2,
		FirstName: "User2",
		Email:     sql.NullString{String: "u2@test.com", Valid: true},
		Password:  sql.NullString{String: "p", Valid: true},
		Status:    "s",
	})

	req := &userpb.GetUsersRequest{Ids: []string{u1.String(), u2.String()}}
	resp, err := server.GetUsers(ctx, req)

	assert.NoError(t, err)
	assert.Len(t, resp.Users, 2)
}

func TestSearchUsers(t *testing.T) {
	server, ctx := setupUserTest(t)
	searchID := uuid.New()

	_, err := server.userRepo.CreateUser(ctx, dbgen.CreateUserParams{
		ID:        searchID,
		Username:  sql.NullString{String: "search_me", Valid: true},
		FirstName: "Search",
		Email:     sql.NullString{String: "search@test.com", Valid: true},
		Password:  sql.NullString{String: "p", Valid: true},
		Status:    "s",
	})
	require.NoError(t, err)

	t.Run("search_by_username", func(t *testing.T) {
		req := &userpb.SearchUsersRequest{
			Query:  "search",
			Global: false,
		}
		resp, err := server.SearchUsers(ctx, req)

		assert.NoError(t, err)
		assert.NotEmpty(t, resp.Users)
		assert.Equal(t, "search_me", *resp.Users[0].Username)
	})
}
