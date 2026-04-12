package middleware

import (
	"log"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-redis/redis_rate/v10"
	"github.com/redis/go-redis/v9"
)

func RateLimit(rdb *redis.Client, limit int, window time.Duration) func(http.Handler) http.Handler {
	limiter := redis_rate.NewLimiter(rdb)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := r.Header.Get("X-Forwarded-For")
			if ip != "" {
				ip = strings.Split(ip, ",")[0]
			} else {
				var err error
				ip, _, err = net.SplitHostPort(r.RemoteAddr)
				if err != nil {
					ip = r.RemoteAddr
				}
			}

			key := "ratelimit:" + ip

			res, err := limiter.Allow(r.Context(), key, redis_rate.Limit{
				Rate:   limit,
				Burst:  limit,
				Period: window,
			})

			if err != nil {
				log.Printf("[ERROR] RateLimiter redis error: %v", err)
				next.ServeHTTP(w, r)
				return
			}

			w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(res.Remaining))
			w.Header().Set("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(res.RetryAfter).Unix(), 10))

			if res.Allowed <= 0 {
				log.Printf("[WARN] Rate limit exceeded for IP: %s (Key: %s). Remaining: %d, RetryAfter: %v",
					ip, key, res.Remaining, res.RetryAfter)

				w.Header().Set("Retry-After", time.Now().Add(res.RetryAfter).Format(time.RFC1123))
				http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
