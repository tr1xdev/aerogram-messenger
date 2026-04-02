package limiter

import (
	"context"
	"time"

	"github.com/go-redis/redis_rate/v10"
	"github.com/redis/go-redis/v9"
)

type RateLimiter interface {
	Allow(ctx context.Context, key string, limit int, window time.Duration) (bool, error)
}

type redisLimiter struct {
	limiter *redis_rate.Limiter
}

func NewRedisLimiter(rdb *redis.Client) RateLimiter {
	return &redisLimiter{
		limiter: redis_rate.NewLimiter(rdb),
	}
}

func (l *redisLimiter) Allow(ctx context.Context, key string, limit int, window time.Duration) (bool, error) {
	res, err := l.limiter.Allow(ctx, key, redis_rate.Limit{
		Rate:   limit,
		Burst:  limit,
		Period: window,
	})
	if err != nil {
		return true, err
	}
	return res.Allowed > 0, nil
}
