package middleware

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/tr1xdev/aerogram-messenger/internal/config"
	"github.com/tr1xdev/aerogram-messenger/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"google.golang.org/grpc/metadata"
	"gorm.io/gorm"
)

type contextKey string

const (
	AuthUserIDKey    contextKey = "auth_user_id"
	AuthSessionIDKey contextKey = "auth_session_id"
	AuthTokenKey     contextKey = "auth_token"
	UserAgentKey     contextKey = "user_agent"
	IPAddressKey     contextKey = "ip_address"
)

func GetUserID(ctx context.Context) string {
	if userID, ok := ctx.Value(AuthUserIDKey).(string); ok {
		return userID
	}
	return ""
}

func GetSessionID(ctx context.Context) string {
	if sessionID, ok := ctx.Value(AuthSessionIDKey).(string); ok {
		return sessionID
	}
	return ""
}

func GetIPAddress(ctx context.Context) string {
	if ip, ok := ctx.Value(IPAddressKey).(string); ok {
		return ip
	}
	return ""
}

func GetUserAgent(ctx context.Context) string {
	if ua, ok := ctx.Value(UserAgentKey).(string); ok {
		return ua
	}
	return ""
}

func AuthMiddleware(cfg *config.Config, db *gorm.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			secret := cfg.JWT.Secret
			authHeader := r.Header.Get("Authorization")
			tokenString := ""

			if strings.HasPrefix(authHeader, "Bearer ") {
				tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			}

			ip, _, _ := net.SplitHostPort(r.RemoteAddr)
			if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
				ip = strings.Split(xff, ",")[0]
			}

			ctx := r.Context()
			ctx = context.WithValue(ctx, IPAddressKey, ip)
			ctx = context.WithValue(ctx, UserAgentKey, r.Header.Get("User-Agent"))

			if tokenString != "" {
				token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
					if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
						return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
					}
					return []byte(secret), nil
				}, jwt.WithLeeway(30*time.Second))

				if err == nil && token.Valid {
					if claims, ok := token.Claims.(jwt.MapClaims); ok {
						userID, _ := claims["sub"].(string)
						sessionID, _ := claims["sid"].(string)

						if userID != "" && sessionID != "" {
							var exists bool
							err := db.Model(&models.Session{}).
								Select("count(*) > 0").
								Where("id = ? AND user_id = ? AND is_active = ?", sessionID, userID, true).
								Find(&exists).Error

							if err != nil || !exists {
								w.Header().Set("Content-Type", "application/json")
								w.WriteHeader(http.StatusUnauthorized)
								fmt.Fprint(w, `{"errors": [{"message": "Session terminated", "extensions": {"code": "UNAUTHENTICATED"}}]}`)
								return
							}

							ctx = context.WithValue(ctx, AuthUserIDKey, userID)
							ctx = context.WithValue(ctx, AuthSessionIDKey, sessionID)
							ctx = context.WithValue(ctx, AuthTokenKey, tokenString)

							md := metadata.Pairs(
								"user-id", userID,
								"session-id", sessionID,
								"ip-address", ip,
								"user-agent", r.Header.Get("User-Agent"),
							)
							ctx = metadata.NewOutgoingContext(ctx, md)
						}
					}
				}
			}
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
