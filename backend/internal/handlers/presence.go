package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/aerogram-org/aerogram-api/internal/middleware"
	"github.com/aerogram-org/aerogram-api/internal/repositories"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func HandlePresence(repo *repositories.PresenceRepository) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := middleware.GetUserID(r.Context())
		if userID == "" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		defer conn.Close()

		ctx := context.Background()
		_ = repo.SetOnline(ctx, userID)

		stopHeartbeat := make(chan struct{})

		go func() {
			ticker := time.NewTicker(45 * time.Second)
			defer ticker.Stop()
			for {
				select {
				case <-ticker.C:
					repo.RefreshOnline(ctx, userID)
				case <-stopHeartbeat:
					return
				}
			}
		}()

		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				break
			}
		}

		close(stopHeartbeat)
		_ = repo.SetOffline(ctx, userID)
	}
}
