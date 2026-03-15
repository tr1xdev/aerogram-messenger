package presence_svc

import (
	"context"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	presencepb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/presence/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/repositories"
)

func setupTest(t *testing.T) (*Server, *miniredis.Miniredis) {
	mr, err := miniredis.Run()
	require.NoError(t, err)

	client := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})

	repo := repositories.NewPresenceRepository(client)
	server := NewServer(repo)

	return server, mr
}

func TestPresenceServer(t *testing.T) {
	server, mr := setupTest(t)
	defer mr.Close()

	ctx := context.Background()

	t.Run("SetOnline", func(t *testing.T) {
		mr.FlushAll()
		userID := uuid.New().String()

		req := &presencepb.SetOnlineRequest{UserId: userID}
		res, err := server.SetOnline(ctx, req)

		require.NoError(t, err)
		assert.True(t, res.Ok)

		val, _ := mr.Get("presence:" + userID)
		assert.Equal(t, "online", val)
	})

	t.Run("IsOnline_True", func(t *testing.T) {
		mr.FlushAll()
		userID := uuid.New().String()
		mr.Set("presence:"+userID, "online")

		req := &presencepb.IsOnlineRequest{UserId: userID}
		res, err := server.IsOnline(ctx, req)

		require.NoError(t, err)
		assert.Equal(t, "online", res.Status)
	})

	t.Run("SetOffline", func(t *testing.T) {
		mr.FlushAll()
		userID := uuid.New().String()
		mr.Set("presence:"+userID, "online")

		req := &presencepb.SetOfflineRequest{UserId: userID}
		res, err := server.SetOffline(ctx, req)

		require.NoError(t, err)
		assert.True(t, res.Ok)

		val, _ := mr.Get("presence:" + userID)
		assert.NotEqual(t, "online", val)
		assert.NotEmpty(t, val)
	})

	t.Run("GetBulk", func(t *testing.T) {
		mr.FlushAll()
		u1 := uuid.New().String()
		u2 := uuid.New().String()
		u3 := uuid.New().String()

		lastSeen := "2026-03-07T12:00:00Z"
		mr.Set("presence:"+u1, "online")
		mr.Set("presence:"+u2, lastSeen)

		req := &presencepb.GetBulkRequest{
			UserIds: []string{u1, u2, u3},
		}
		res, err := server.GetBulk(ctx, req)

		require.NoError(t, err)
		assert.Equal(t, "online", res.Statuses[u1])
		assert.Equal(t, lastSeen, res.Statuses[u2])
		assert.Equal(t, "offline", res.Statuses[u3])
	})
}
