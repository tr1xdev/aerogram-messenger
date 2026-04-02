package middleware

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/tr1xdev/aerogram-messenger/internal/config"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"google.golang.org/grpc/metadata"
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

func AuthMiddleware(cfg *config.Config, db *database.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			secret := cfg.Auth.JWT.Secret
			authHeader := r.Header.Get("Authorization")
			tokenString := ""

			if after, ok := strings.CutPrefix(authHeader, "Bearer "); ok {
				tokenString = after
			}

			ip, _, _ := net.SplitHostPort(r.RemoteAddr)
			if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
				ip = strings.Split(xff, ",")[0]
			}

			ctx := r.Context()
			ctx = context.WithValue(ctx, IPAddressKey, ip)
			ctx = context.WithValue(ctx, UserAgentKey, r.Header.Get("User-Agent"))

			if tokenString != "" {
				token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
					if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
						return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
					}
					return []byte(secret), nil
				}, jwt.WithLeeway(30*time.Second))

				if err == nil && token.Valid {
					if claims, ok := token.Claims.(jwt.MapClaims); ok {
						userIDStr, _ := claims["sub"].(string)
						sessionIDStr, _ := claims["sid"].(string)
						isBot, _ := claims["is_bot"].(bool)

						if userIDStr != "" {
							authorized := false

							if isBot {
								authorized = true
								if sessionIDStr == "" {
									sessionIDStr = "bot_session"
								}
							} else if sessionIDStr != "" {
								uid, _ := uuid.Parse(userIDStr)
								sid, _ := uuid.Parse(sessionIDStr)

								_, err := db.Queries.GetActiveSession(ctx, dbgen.GetActiveSessionParams{
									ID:     sid,
									UserID: uid,
								})

								if err == nil {
									authorized = true
								} else {
									w.Header().Set("Content-Type", "application/json")
									w.WriteHeader(http.StatusUnauthorized)
									fmt.Fprint(w, `{"errors": [{"message": "Session terminated"}]}`)
									return
								}
							}

							if authorized {
								ctx = context.WithValue(ctx, AuthUserIDKey, userIDStr)
								ctx = context.WithValue(ctx, AuthSessionIDKey, sessionIDStr)
								ctx = context.WithValue(ctx, AuthTokenKey, tokenString)

								md := metadata.Pairs(
									"user-id", userIDStr,
									"session-id", sessionIDStr,
									"ip-address", ip,
									"user-agent", r.Header.Get("User-Agent"),
								)
								ctx = metadata.NewOutgoingContext(ctx, md)
							}
						}
					}
				}
			}
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
