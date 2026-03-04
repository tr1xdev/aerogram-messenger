package user_svc

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	errorspb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/errors/v1"
	userpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/user/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	m := db.Migrator()

	if m.HasTable(&models.User{}) {
		m.DropTable(&models.User{})
	}

	db.Exec("CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT, first_name TEXT, last_name TEXT, email TEXT, password TEXT, status TEXT, is_premium INTEGER, is_email_verified INTEGER, verification_token TEXT, verification_expiry DATETIME, public_key TEXT, encrypted_priv_key TEXT, encryption_iv TEXT, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME)")

	return db
}

func TestUserInfo(t *testing.T) {
	db := setupTestDB(t)
	server := NewServer(db)
	ctx := context.Background()

	testUser := models.User{
		ID:        "user_1",
		FirstName: "Alice",
		Username:  "alice_hub",
		Email:     "alice@test.com",
	}
	db.Create(&testUser)

	t.Run("success_by_id", func(t *testing.T) {
		req := &userpb.UserInfoRequest{
			Identifier: &userpb.UserInfoRequest_Id{Id: "user_1"},
		}
		resp, err := server.UserInfo(ctx, req)

		assert.NoError(t, err)
		require.NotNil(t, resp.GetUser())
		assert.Equal(t, "Alice", resp.GetUser().FirstName)
	})

	t.Run("not_found", func(t *testing.T) {
		req := &userpb.UserInfoRequest{
			Identifier: &userpb.UserInfoRequest_Id{Id: "unknown"},
		}
		resp, err := server.UserInfo(ctx, req)

		assert.NoError(t, err)
		require.NotNil(t, resp.GetError())
		assert.Equal(t, errorspb.ErrorCode_ERROR_CODE_NOT_FOUND, *resp.GetError().Code)
	})
}

func TestUpdateUser(t *testing.T) {
	db := setupTestDB(t)
	server := NewServer(db)
	ctx := context.Background()

	testUser := models.User{
		ID:        "user_update",
		FirstName: "OldName",
		Email:     "update@test.com",
	}
	db.Create(&testUser)

	t.Run("partial_update_success", func(t *testing.T) {
		newName := "NewName"
		req := &userpb.UpdateUserRequest{
			Id:        "user_update",
			FirstName: &newName,
		}

		resp, err := server.UpdateUser(ctx, req)
		assert.NoError(t, err)
		require.NotNil(t, resp.GetUser())
		assert.Equal(t, newName, resp.GetUser().FirstName)

		var updated models.User
		db.First(&updated, "id = ?", "user_update")
		assert.Equal(t, newName, updated.FirstName)
	})
}

func TestGetUsers(t *testing.T) {
	db := setupTestDB(t)
	server := NewServer(db)
	ctx := context.Background()

	db.Create(&models.User{ID: "u1", FirstName: "User1", Email: "u1@test.com"})
	db.Create(&models.User{ID: "u2", FirstName: "User2", Email: "u2@test.com"})

	req := &userpb.GetUsersRequest{Ids: []string{"u1", "u2"}}
	resp, err := server.GetUsers(ctx, req)

	assert.NoError(t, err)
	assert.Len(t, resp.Users, 2)
}
