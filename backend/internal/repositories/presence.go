package repositories

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type PresenceStatus struct {
	UserID   uuid.UUID `json:"userId"`
	Status   string    `json:"status"`
	ChatID   string    `json:"chatId,omitempty"`
	LastSeen string    `json:"lastSeen,omitempty"`
	IsTyping bool      `json:"isTyping,omitempty"`
}

type PresenceRepository struct {
	redis *redis.Client
}

func NewPresenceRepository(rdb *redis.Client) *PresenceRepository {
	return &PresenceRepository{redis: rdb}
}

func (r *PresenceRepository) key(userID uuid.UUID) string {
	return "presence:" + userID.String()
}

func (r *PresenceRepository) typingKey(chatID string) string {
	return fmt.Sprintf("typing:%s", chatID)
}

func (r *PresenceRepository) GetRedisClient() *redis.Client {
	return r.redis
}

func (r *PresenceRepository) PublishStatus(ctx context.Context, status PresenceStatus) error {
	payload, err := json.Marshal(status)
	if err != nil {
		return err
	}
	return r.redis.Publish(ctx, "presence:updates", payload).Err()
}

func (r *PresenceRepository) PublishTyping(ctx context.Context, status PresenceStatus) error {
	payload, err := json.Marshal(status)
	if err != nil {
		return err
	}
	return r.redis.Publish(ctx, r.typingKey(status.ChatID), payload).Err()
}

func (r *PresenceRepository) SetOnline(ctx context.Context, userID uuid.UUID, ttl time.Duration) error {
	if err := r.redis.Set(ctx, r.key(userID), "online", ttl).Err(); err != nil {
		return err
	}
	return r.PublishStatus(ctx, PresenceStatus{
		UserID: userID,
		Status: "online",
	})
}

func (r *PresenceRepository) SetOffline(ctx context.Context, userID uuid.UUID) error {
	lastSeen := time.Now().Format(time.RFC3339)
	if err := r.redis.Set(ctx, r.key(userID), lastSeen, 24*time.Hour).Err(); err != nil {
		return err
	}

	return r.PublishStatus(ctx, PresenceStatus{
		UserID:   userID,
		Status:   lastSeen,
		LastSeen: lastSeen,
	})
}

func (r *PresenceRepository) GetStatus(ctx context.Context, userID uuid.UUID) (string, error) {
	val, err := r.redis.Get(ctx, r.key(userID)).Result()
	if err == redis.Nil {
		return "offline", nil
	}
	if err != nil {
		return "offline", err
	}

	return val, nil
}

func (r *PresenceRepository) GetStatuses(ctx context.Context, userIDs []uuid.UUID) (map[uuid.UUID]string, error) {
	if len(userIDs) == 0 {
		return make(map[uuid.UUID]string), nil
	}

	keys := make([]string, len(userIDs))
	for i, id := range userIDs {
		keys[i] = r.key(id)
	}

	values, err := r.redis.MGet(ctx, keys...).Result()
	if err != nil {
		return nil, err
	}

	result := make(map[uuid.UUID]string)
	for i, val := range values {
		status := "offline"
		if val != nil {
			if s, ok := val.(string); ok {
				status = s
			}
		}
		result[userIDs[i]] = status
	}
	return result, nil
}
