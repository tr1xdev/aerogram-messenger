package middleware

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"

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

func ParseToken(tokenString string) (string, error) {
	secret := os.Getenv("JWT_SECRET")

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		if userID, ok := claims["sub"].(string); ok {
			return userID, nil
		}
	}
	return "", fmt.Errorf("invalid token claims")
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		secret := os.Getenv("JWT_SECRET")

		md := metadata.New(map[string]string{
			"x-real-ip":       getIP(r),
			"x-client-device": r.UserAgent(),
		})

		ctx := metadata.NewOutgoingContext(r.Context(), md)

		tokenString := ""
		authHeader := r.Header.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		}

		if tokenString == "" {
			tokenString = r.URL.Query().Get("token")
		}

		if tokenString != "" {
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				return []byte(secret), nil
			})

			if err == nil && token.Valid {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					userID, okUID := claims["sub"].(string)
					sessionID, okSID := claims["sid"].(string)

					if okUID {
						ctx = context.WithValue(ctx, AuthUserIDKey, userID)
						ctx = context.WithValue(ctx, AuthTokenKey, token)
					}
					if okSID {
						ctx = context.WithValue(ctx, AuthSessionIDKey, sessionID)
					}
				}
			}
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func getIP(r *http.Request) string {
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	if ip := r.Header.Get("X-Forwarded-For"); ip != "" {
		return strings.Split(ip, ",")[0]
	}
	return r.RemoteAddr
}
