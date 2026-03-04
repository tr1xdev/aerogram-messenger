package messages_svc

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	messagespb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/messages/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/models"
	"github.com/tr1xdev/aerogram-messenger/internal/testutils"
)

func setupTest(t *testing.T) (*Server, *miniredis.Miniredis) {
	db := testutils.SetupTestDB(t)

	db.Exec("PRAGMA foreign_keys = OFF")

	err := db.AutoMigrate(&models.Dialog{}, &models.DialogMember{}, &models.Message{})
	require.NoError(t, err)

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
	chatID := "chat_123"
	userID := "user_456"

	require.NoError(t, server.db.Create(&models.Dialog{ID: chatID, Type: models.Private}).Error)
	require.NoError(t, server.db.Create(&models.DialogMember{DialogID: chatID, UserID: userID, Role: models.RoleMember}).Error)

	t.Run("SendMessage_Success", func(t *testing.T) {
		pubsub := server.rdb.Subscribe(ctx, "chat:"+chatID)
		defer pubsub.Close()

		req := &messagespb.SendMessageRequest{
			ChatId:   chatID,
			SenderId: userID,
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
			ChatId:   chatID,
			SenderId: "stranger_id",
			Text:     "I am not in this chat",
		}

		res, err := server.SendMessage(ctx, req)
		assert.Error(t, err)
		assert.Nil(t, res)
		assert.Equal(t, "forbidden", err.Error())
	})

	t.Run("GetHistory", func(t *testing.T) {
		req := &messagespb.GetHistoryRequest{
			ChatId: chatID,
			Limit:  10,
			Offset: 0,
		}

		res, err := server.GetHistory(ctx, req)
		assert.NoError(t, err)
		assert.NotEmpty(t, res.Messages)
	})
}
