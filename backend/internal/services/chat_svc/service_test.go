package chat_svc

import (
	"context"
	"database/sql"
	"strings"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/tr1xdev/aerogram-messenger/internal/config"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	chatpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/chat/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/infrastructure/limiter"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

func ptr[T any](v T) *T {
	return &v
}

func nullStr(s string) sql.NullString {
	return sql.NullString{String: s, Valid: s != ""}
}

func setupTest(t *testing.T) (*Server, *miniredis.Miniredis) {
	mr, err := miniredis.Run()
	require.NoError(t, err)

	rdb := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})

	db := database.SetupTestDB(t)
	l := limiter.NewRedisLimiter(rdb)
	cfg := config.ChatLimitConfig{
		Create: config.LimitEntry{Limit: 100, Window: time.Minute},
		Delete: config.LimitEntry{Limit: 100, Window: time.Minute},
	}

	return NewServer(db, rdb, l, cfg), mr
}

func createUser(t *testing.T, s *Server, id string) {
	uid, err := uuid.Parse(id)
	require.NoError(t, err)

	shortID := uid.String()[:8]

	_, err = s.db.Queries.CreateUser(context.Background(), dbgen.CreateUserParams{
		ID:        uid,
		Username:  nullStr("u_" + shortID),
		FirstName: "Test",
		Email:     nullStr("e_" + shortID + "@t.com"),
		Password:  nullStr("hash"),
		Status:    "ONLINE",
	})

	if err != nil && !strings.Contains(err.Error(), "duplicate key") {
		require.NoError(t, err)
	}
}

func TestChatServer(t *testing.T) {
	server, mr := setupTest(t)
	defer mr.Close()
	ctx := context.Background()

	t.Run("CreateChat_Success", func(t *testing.T) {
		cID := uuid.New().String()
		pID := uuid.New().String()

		createUser(t, server, cID)
		createUser(t, server, pID)

		req := &chatpb.CreateChatRequest{
			CreatorId:      cID,
			ParticipantIds: []string{cID, pID},
			Type:           chatpb.ChatType_CHAT_TYPE_PRIVATE,
			Title:          ptr("Private Chat"),
		}

		res, err := server.CreateChat(ctx, req)
		require.NoError(t, err)
		assert.NotNil(t, res.Chat)
		assert.Equal(t, "Private Chat", res.Chat.Title)
	})

	t.Run("CreateChat_RateLimitExceeded", func(t *testing.T) {
		server.cfg.Create.Limit = 1
		uID := uuid.New().String()
		pID := uuid.New().String()

		createUser(t, server, uID)
		createUser(t, server, pID)

		req := &chatpb.CreateChatRequest{
			CreatorId:      uID,
			ParticipantIds: []string{uID, pID},
			Type:           chatpb.ChatType_CHAT_TYPE_PRIVATE,
		}

		_, err := server.CreateChat(ctx, req)
		require.NoError(t, err)

		_, err = server.CreateChat(ctx, req)
		require.Error(t, err)
		st, ok := status.FromError(err)
		assert.True(t, ok)
		assert.Equal(t, codes.ResourceExhausted, st.Code())

		server.cfg.Create.Limit = 100
	})

	t.Run("GetMyChats", func(t *testing.T) {
		uID := uuid.New().String()
		createUser(t, server, uID)

		md := metadata.Pairs("user-id", uID)
		authCtx := metadata.NewIncomingContext(ctx, md)

		res, err := server.GetMyChats(authCtx, &chatpb.GetMyChatsRequest{})
		assert.NoError(t, err)
		assert.NotNil(t, res)
	})

	t.Run("PinChat_Success", func(t *testing.T) {
		uID := uuid.New().String()
		chatID := uuid.New()
		createUser(t, server, uID)
		uUUID := uuid.MustParse(uID)

		_, err := server.db.Queries.CreateDialog(ctx, dbgen.CreateDialogParams{
			ID:           chatID,
			Type:         "private",
			IsActive:     true,
			Name:         nullStr("Test Chat"),
			CreatorID:    uuid.NullUUID{UUID: uUUID, Valid: true},
			MembersCount: 1,
		})
		require.NoError(t, err)

		err = server.db.Queries.AddDialogMember(ctx, dbgen.AddDialogMemberParams{
			DialogID: chatID,
			UserID:   uUUID,
			Role:     "member",
		})
		require.NoError(t, err)

		md := metadata.Pairs("user-id", uID)
		authCtx := metadata.NewIncomingContext(ctx, md)

		req := &chatpb.PinChatRequest{
			ChatId: chatID.String(),
			UserId: uID,
			Pinned: true,
		}

		res, err := server.PinChat(authCtx, req)
		assert.NoError(t, err)
		assert.True(t, res.Success)

		member, err := server.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
			DialogID: chatID,
			UserID:   uUUID,
		})
		assert.NoError(t, err)
		assert.True(t, member.IsPinned)
	})
}
