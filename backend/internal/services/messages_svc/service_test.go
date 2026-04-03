package messages_svc

import (
	"context"
	"database/sql"
	"encoding/json"
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
	messagespb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/messages/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/infrastructure/limiter"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type testEnv struct {
	server *Server
	mr     *miniredis.Miniredis
	rdb    *redis.Client
	db     *database.DB
	cfg    config.MessagesLimitConfig
}

func setupTest(t *testing.T) *testEnv {
	t.Helper()
	db := database.SetupTestDB(t)
	mr, err := miniredis.Run()
	require.NoError(t, err)

	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	l := limiter.NewRedisLimiter(rdb)

	cfg := config.MessagesLimitConfig{
		Send:    config.LimitEntry{Limit: 5, Window: 5 * time.Second},
		History: config.LimitEntry{Limit: 20, Window: 10 * time.Second},
		Update:  config.LimitEntry{Limit: 5, Window: 5 * time.Second},
		Delete:  config.LimitEntry{Limit: 5, Window: 5 * time.Second},
	}

	server := NewServer(db, rdb, l, cfg)

	return &testEnv{
		server: server,
		mr:     mr,
		rdb:    rdb,
		db:     db,
		cfg:    cfg,
	}
}

func seedUser(t *testing.T, db *database.DB, id uuid.UUID, username string) {
	t.Helper()
	_, err := db.Queries.CreateUser(context.Background(), dbgen.CreateUserParams{
		ID:        id,
		Username:  sql.NullString{String: username, Valid: true},
		FirstName: "Test",
		Email:     sql.NullString{String: username + "@aerogram.com", Valid: true},
		Password:  sql.NullString{String: "hash_satisfy_check", Valid: true},
		Status:    "online",
	})
	require.NoError(t, err)
}

func seedChat(t *testing.T, db *database.DB, chatID, userID uuid.UUID) {
	t.Helper()
	_, err := db.Queries.CreateDialog(context.Background(), dbgen.CreateDialogParams{
		ID:        chatID,
		Type:      "private",
		IsActive:  true,
		CreatorID: uuid.NullUUID{UUID: userID, Valid: true},
	})
	require.NoError(t, err)

	err = db.Queries.AddDialogMember(context.Background(), dbgen.AddDialogMemberParams{
		DialogID: chatID,
		UserID:   userID,
		Role:     "member",
	})
	require.NoError(t, err)
}

func TestMessagesServer_SendMessage(t *testing.T) {
	env := setupTest(t)
	defer env.mr.Close()

	ctx := context.Background()
	chatID := uuid.New()
	userID := uuid.New()

	seedUser(t, env.db, userID, "sender")
	seedChat(t, env.db, chatID, userID)

	t.Run("success_increment_sequence", func(t *testing.T) {
		req := &messagespb.SendMessageRequest{
			ChatId:   chatID.String(),
			SenderId: userID.String(),
			Text:     "First",
		}

		res1, err := env.server.SendMessage(ctx, req)
		require.NoError(t, err)
		assert.Equal(t, int64(1), res1.Message.Sequence)

		req.Text = "Second"
		res2, err := env.server.SendMessage(ctx, req)
		require.NoError(t, err)
		assert.Equal(t, int64(2), res2.Message.Sequence)
	})

	t.Run("rate_limit_exceeded", func(t *testing.T) {
		req := &messagespb.SendMessageRequest{
			ChatId:   chatID.String(),
			SenderId: userID.String(),
			Text:     "Spam",
		}

		for range 3 {
			_, err := env.server.SendMessage(ctx, req)
			require.NoError(t, err)
		}

		res, err := env.server.SendMessage(ctx, req)
		assert.Error(t, err)
		assert.Nil(t, res)

		st, ok := status.FromError(err)
		assert.True(t, ok)
		assert.Equal(t, codes.ResourceExhausted, st.Code())
	})

	t.Run("publish_to_redis", func(t *testing.T) {
		env.mr.FlushAll()

		pubsub := env.rdb.Subscribe(ctx, "chat:"+chatID.String())
		defer pubsub.Close()

		req := &messagespb.SendMessageRequest{
			ChatId:   chatID.String(),
			SenderId: userID.String(),
			Text:     "Redis check",
		}

		res, err := env.server.SendMessage(ctx, req)
		require.NoError(t, err)

		msg, err := pubsub.ReceiveMessage(ctx)
		require.NoError(t, err)

		var received messagespb.Message
		err = json.Unmarshal([]byte(msg.Payload), &received)
		require.NoError(t, err)
		assert.Equal(t, res.Message.Id, received.Id)
	})
}

func TestMessagesServer_GetHistory(t *testing.T) {
	env := setupTest(t)
	defer env.mr.Close()

	ctx := context.Background()
	chatID := uuid.New()
	userID := uuid.New()

	seedUser(t, env.db, userID, "history_user")
	seedChat(t, env.db, chatID, userID)

	for range 3 {
		_, err := env.server.SendMessage(ctx, &messagespb.SendMessageRequest{
			ChatId:   chatID.String(),
			SenderId: userID.String(),
			Text:     "msg",
		})
		require.NoError(t, err)
	}

	t.Run("fetch_descending", func(t *testing.T) {
		req := &messagespb.GetHistoryRequest{
			ChatId: chatID.String(),
			Limit:  10,
		}

		res, err := env.server.GetHistory(ctx, req)
		require.NoError(t, err)
		assert.Len(t, res.Messages, 3)
		if len(res.Messages) >= 2 {
			assert.True(t, res.Messages[0].Sequence > res.Messages[1].Sequence)
		}
	})
}
