package repositories

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type PresenceRepository struct {
	redis *redis.Client
}

func NewPresenceRepository(rdb *redis.Client) *PresenceRepository {
	return &PresenceRepository{redis: rdb}
}

func (r *PresenceRepository) key(userID string) string {
	return fmt.Sprintf("presence:%s", userID)
}

func (r *PresenceRepository) SetOnline(ctx context.Context, userID string) error {
	err := r.redis.Set(ctx, r.key(userID), "online", 0).Err()
	if err != nil {
		return err
	}
	return r.publishStatus(ctx, userID, "online")
}

func (r *PresenceRepository) SetOffline(ctx context.Context, userID string) error {
	lastSeen := time.Now().Format(time.RFC3339)
	err := r.redis.Set(ctx, r.key(userID), lastSeen, 0).Err()
	if err != nil {
		return err
	}
	return r.publishStatus(ctx, userID, lastSeen)
}

func (r *PresenceRepository) GetStatus(ctx context.Context, userID string) (string, error) {
	val, err := r.redis.Get(ctx, r.key(userID)).Result()
	if err == redis.Nil {
		return "offline", nil
	}
	if err != nil {
		return "offline", err
	}
	return val, nil
}

func (r *PresenceRepository) GetStatuses(ctx context.Context, userIDs []string) (map[string]string, error) {
	if len(userIDs) == 0 {
		return make(map[string]string), nil
	}

	keys := make([]string, len(userIDs))
	for i, id := range userIDs {
		keys[i] = r.key(id)
	}

	values, err := r.redis.MGet(ctx, keys...).Result()
	if err != nil {
		return nil, err
	}

	result := make(map[string]string)
	for i, val := range values {
		status := "offline"
		if val != nil {
			status = val.(string)
		}
		result[userIDs[i]] = status
	}

	return result, nil
}

func (r *PresenceRepository) publishStatus(ctx context.Context, userID, status string) error {
	payload, _ := json.Marshal(map[string]string{
		"userId": userID,
		"status": status,
	})
	return r.redis.Publish(ctx, "presence:updates", payload).Err()
}
