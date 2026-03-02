package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/aerogram-org/aerogram-api/internal/config"
	"github.com/golang-jwt/jwt/v5"
	"google.golang.org/grpc/metadata"
)

type contextKey string

const (
	AuthUserIDKey    contextKey = "auth_user_id"
	AuthSessionIDKey contextKey = "auth_session_id"
	AuthTokenKey     contextKey = "auth_token"
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

func AuthMiddleware(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			secret := cfg.JWT.Secret
			authHeader := r.Header.Get("Authorization")
			tokenString := ""

			if strings.HasPrefix(authHeader, "Bearer ") {
				tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			}

			ctx := r.Context()

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

						if userID != "" {
							ctx = context.WithValue(ctx, AuthUserIDKey, userID)
							ctx = context.WithValue(ctx, AuthSessionIDKey, sessionID)
							ctx = context.WithValue(ctx, AuthTokenKey, tokenString)

							md := metadata.Pairs("user-id", userID, "session-id", sessionID)
							ctx = metadata.NewOutgoingContext(ctx, md)
						}
					}
				}
			}
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
