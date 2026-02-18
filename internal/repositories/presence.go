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
	return fmt.Sprintf("user:presence:%s", userID)
}

func (r *PresenceRepository) SetOnline(ctx context.Context, userID string) error {
	current, _ := r.GetStatus(ctx, userID)

	err := r.redis.Set(ctx, r.key(userID), "online", 60*time.Second).Err()
	if err != nil {
		return err
	}

	if current != "online" {
		return r.publishStatus(ctx, userID, "online")
	}
	return nil
}

func (r *PresenceRepository) RefreshOnline(ctx context.Context, userID string) {
	exists, _ := r.redis.Expire(ctx, r.key(userID), 60*time.Second).Result()
	if !exists {
		_ = r.SetOnline(ctx, userID)
	}
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
	return val, nil
}

func (r *PresenceRepository) publishStatus(ctx context.Context, userID, status string) error {
	payload, _ := json.Marshal(map[string]string{
		"userId": userID,
		"status": status,
	})
	return r.redis.Publish(ctx, "presence:updates", payload).Err()
}
