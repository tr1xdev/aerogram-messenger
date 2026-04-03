package middleware

import (
	"net"
	"net/http"
	"time"

	"github.com/go-redis/redis_rate/v10"
	"github.com/redis/go-redis/v9"
)

func RateLimit(rdb *redis.Client, limit int, window time.Duration) func(http.Handler) http.Handler {
	limiter := redis_rate.NewLimiter(rdb)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip, _, err := net.SplitHostPort(r.RemoteAddr)
			if err != nil {
				ip = r.RemoteAddr
			}

			key := "ratelimit:" + ip

			res, err := limiter.Allow(r.Context(), key, redis_rate.Limit{
				Rate:   limit,
				Burst:  limit,
				Period: window,
			})

			if err != nil {
				next.ServeHTTP(w, r)
				return
			}

			if res.Allowed <= 0 {
				w.Header().Set("Retry-After", time.Now().Add(res.RetryAfter).Format(time.RFC1123))
				http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
