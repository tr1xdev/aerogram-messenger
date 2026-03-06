package messages_svc

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	messagespb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/messages/v1"
)

func setupTest(t *testing.T) (*Server, *miniredis.Miniredis) {
	db := database.SetupTestDB(t)

	mr, err := miniredis.Run()
	require.NoError(t, err)

	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	server := NewServer(db, rdb)

	return server, mr
}

func TestMessagesServer(t *testing.T) {
	server, mr := setupTest(t)
	defer mr.Close()

	ctx := context.Background()
	chatID := uuid.New()
	userID := uuid.New()

	_, err := server.db.Queries.CreateUser(ctx, dbgen.CreateUserParams{
		ID:        userID,
		Username:  database.ToNullString(ptr("testuser")),
		FirstName: "Test",
		Email:     "test@aerogram.com",
		Password:  "hash",
		Status:    "online",
	})
	require.NoError(t, err)

	_, err = server.db.Queries.CreateDialog(ctx, dbgen.CreateDialogParams{
		ID:           chatID,
		Type:         "private",
		IsActive:     true,
		MembersCount: 1,
	})
	require.NoError(t, err)

	err = server.db.Queries.AddDialogMember(ctx, dbgen.AddDialogMemberParams{
		DialogID: chatID,
		UserID:   userID,
		Role:     "member",
	})
	require.NoError(t, err)

	t.Run("SendMessage_Success", func(t *testing.T) {
		pubsub := server.rdb.Subscribe(ctx, "chat:"+chatID.String())
		defer pubsub.Close()

		req := &messagespb.SendMessageRequest{
			ChatId:   chatID.String(),
			SenderId: userID.String(),
			Text:     "Hello world",
		}

		res, err := server.SendMessage(ctx, req)
		require.NoError(t, err)
		require.NotNil(t, res)
		assert.Equal(t, "Hello world", res.Message.Text)

		msg, err := pubsub.ReceiveMessage(ctx)
		assert.NoError(t, err)

		var receivedMsg messagespb.Message
		err = json.Unmarshal([]byte(msg.Payload), &receivedMsg)
		assert.NoError(t, err)
		assert.Equal(t, res.Message.Id, receivedMsg.Id)
	})

	t.Run("SendMessage_Forbidden", func(t *testing.T) {
		req := &messagespb.SendMessageRequest{
			ChatId:   chatID.String(),
			SenderId: uuid.New().String(),
			Text:     "I am not in this chat",
		}

		res, err := server.SendMessage(ctx, req)
		assert.Error(t, err)
		assert.Nil(t, res)
	})

	t.Run("GetHistory", func(t *testing.T) {
		req := &messagespb.GetHistoryRequest{
			ChatId: chatID.String(),
			Limit:  10,
			Offset: 0,
		}

		res, err := server.GetHistory(ctx, req)
		assert.NoError(t, err)
		assert.NotEmpty(t, res.Messages)
	})
}

func ptr(s string) *string {
	return &s
}
