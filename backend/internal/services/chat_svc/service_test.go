package chat_svc

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	chatpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/chat/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/models"
	"github.com/tr1xdev/aerogram-messenger/internal/testutils"
	"google.golang.org/grpc/metadata"
)

func ptr[T any](v T) *T {
	return &v
}

func setupTest(t *testing.T) *Server {
	db := testutils.SetupTestDB(t)
	db.AutoMigrate(&models.Dialog{}, &models.DialogMember{})
	return NewServer(db)
}

func TestChatServer(t *testing.T) {
	server := setupTest(t)
	ctx := context.Background()

	t.Run("CreateChat_Success", func(t *testing.T) {
		req := &chatpb.CreateChatRequest{
			CreatorId:      "user_1",
			ParticipantIds: []string{"user_1", "user_2"},
			Type:           chatpb.ChatType_CHAT_TYPE_PRIVATE,
			Title:          ptr("Private Chat"),
		}

		res, err := server.CreateChat(ctx, req)
		require.NoError(t, err)
		assert.NotNil(t, res.Chat)
		assert.Equal(t, "Private Chat", res.Chat.Title)
	})

	t.Run("DuplicatePrivateChat", func(t *testing.T) {
		participants := []string{"user_a", "user_b"}
		req := &chatpb.CreateChatRequest{
			CreatorId:      "user_a",
			ParticipantIds: participants,
			Type:           chatpb.ChatType_CHAT_TYPE_PRIVATE,
		}

		res1, err := server.CreateChat(ctx, req)
		require.NoError(t, err)

		res2, err := server.CreateChat(ctx, req)
		require.NoError(t, err)

		assert.Equal(t, res1.Chat.Id, res2.Chat.Id)
	})

	t.Run("GetMyChats", func(t *testing.T) {
		userID := "user_target"
		server.db.Create(&models.Dialog{
			ID:   "dialog_1",
			Type: models.Private,
			Name: ptr("Chat 1"),
		})
		server.db.Create(&models.DialogMember{DialogID: "dialog_1", UserID: userID})

		md := metadata.Pairs("user-id", userID)
		authCtx := metadata.NewIncomingContext(ctx, md)

		res, err := server.GetMyChats(authCtx, &chatpb.GetMyChatsRequest{})
		assert.NoError(t, err)
		assert.Len(t, res.Chats, 1)
	})

	t.Run("GetChat_BySlug", func(t *testing.T) {
		userID := "user_target"
		server.db.Create(&models.Dialog{
			ID:       "dialog_slug",
			Type:     models.Channel,
			Name:     ptr("Channel"),
			Username: ptr("my_channel"),
		})
		server.db.Create(&models.DialogMember{DialogID: "dialog_slug", UserID: userID})

		md := metadata.Pairs("user-id", userID)
		authCtx := metadata.NewIncomingContext(ctx, md)

		req := &chatpb.GetChatRequest{
			Slug: ptr("my_channel"),
		}
		res, err := server.GetChat(authCtx, req)
		require.NoError(t, err)
		assert.Equal(t, "dialog_slug", res.Chat.Id)
	})
}
