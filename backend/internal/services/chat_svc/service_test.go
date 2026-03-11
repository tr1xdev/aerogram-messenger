package chat_svc

import (
	"context"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	chatpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/chat/v1"
	"google.golang.org/grpc/metadata"
)

func ptr[T any](v T) *T {
	return &v
}

func setupTest(t *testing.T) *Server {
	db := database.SetupTestDB(t)
	return NewServer(db)
}

func createUser(t *testing.T, s *Server, id string) {
	uid, err := uuid.Parse(id)
	require.NoError(t, err)

	shortID := uid.String()[:8]

	_, err = s.db.Queries.CreateUser(context.Background(), dbgen.CreateUserParams{
		ID:        uid,
		Username:  database.ToNullString(ptr("u_" + shortID)),
		FirstName: "Test",
		Email:     "e_" + shortID + "@t.com",
		Password:  "hash",
		Status:    "ONLINE",
	})

	if err != nil && !strings.Contains(err.Error(), "duplicate key") {
		require.NoError(t, err)
	}
}

func TestChatServer(t *testing.T) {
	server := setupTest(t)
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
			ID:       chatID,
			Type:     "private",
			IsActive: true,
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
