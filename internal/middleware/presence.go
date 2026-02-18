package middleware

import (
	"net/http"

	"github.com/aerogram-org/aerogram-api/internal/repositories"
	"github.com/gorilla/websocket"
)

func PresenceMiddleware(repo *repositories.PresenceRepository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !websocket.IsWebSocketUpgrade(r) {
				next.ServeHTTP(w, r)
				return
			}

			userID := GetUserID(r.Context())
			if userID == "" {
				next.ServeHTTP(w, r)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
