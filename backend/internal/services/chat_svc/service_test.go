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
	"github.com/tr1xdev/aerogram-messenger/internal/graph/helpers"
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

func withAuth(ctx context.Context, userID string) context.Context {
	md := metadata.Pairs("user-id", userID)
	return metadata.NewIncomingContext(ctx, md)
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

		authCtx := withAuth(ctx, cID)
		res, err := server.CreateChat(authCtx, req)
		require.NoError(t, err)
		assert.NotNil(t, res.Chat)
		assert.Equal(t, "Private Chat", res.Chat.Title)
	})

	t.Run("JoinChatBySlug_Success", func(t *testing.T) {
		creatorID := uuid.New().String()
		joinerID := uuid.New().String()
		slug := "test_channel_" + uuid.New().String()[:4]

		createUser(t, server, creatorID)
		createUser(t, server, joinerID)

		creatorCtx := withAuth(ctx, creatorID)
		createRes, err := server.CreateChat(creatorCtx, &chatpb.CreateChatRequest{
			CreatorId: creatorID,
			Type:      chatpb.ChatType_CHAT_TYPE_CHANNEL,
			Title:     ptr("Public Channel"),
			Slug:      ptr(slug),
		})
		require.NoError(t, err)

		joinerCtx := withAuth(ctx, joinerID)
		res, err := server.JoinChatBySlug(joinerCtx, &chatpb.JoinChatBySlugRequest{
			Slug: slug,
		})

		assert.NoError(t, err)
		assert.True(t, res.Success)
		assert.NotEmpty(t, res.ChatId)

		uUUID := uuid.MustParse(joinerID)
		chatID := uuid.MustParse(helpers.ToRawID(createRes.Chat.Id))
		member, err := server.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
			DialogID: chatID,
			UserID:   uUUID,
		})
		assert.NoError(t, err)
		assert.Equal(t, "member", member.Role)
	})

	t.Run("JoinChatBySlug_NotFound", func(t *testing.T) {
		uID := uuid.New().String()
		createUser(t, server, uID)

		authCtx := withAuth(ctx, uID)
		_, err := server.JoinChatBySlug(authCtx, &chatpb.JoinChatBySlugRequest{
			Slug: "non_existent_slug",
		})

		assert.Error(t, err)
		st, _ := status.FromError(err)
		assert.Equal(t, codes.NotFound, st.Code())
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

		authCtx := withAuth(ctx, uID)
		_, err := server.CreateChat(authCtx, req)
		require.NoError(t, err)

		_, err = server.CreateChat(authCtx, req)
		require.Error(t, err)
		st, ok := status.FromError(err)
		assert.True(t, ok)
		assert.Equal(t, codes.ResourceExhausted, st.Code())

		server.cfg.Create.Limit = 100
	})

	t.Run("GetMyChats", func(t *testing.T) {
		uID := uuid.New().String()
		createUser(t, server, uID)

		authCtx := withAuth(ctx, uID)
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

		authCtx := withAuth(ctx, uID)
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
