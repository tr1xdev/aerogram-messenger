package graph_api

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/tr1xdev/aerogram-messenger/internal/config"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/graph"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/loaders"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/resolvers"
	presencepb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/presence/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/middleware"
)

func NewGraphQLServer(res *resolvers.Resolver, cfg *config.Config, db *database.DB) *handler.Server {
	schema := graph.NewExecutableSchema(graph.Config{Resolvers: res})
	srv := handler.New(schema)

	srv.AddTransport(transport.Websocket{
		KeepAlivePingInterval: 10 * time.Second,
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
		InitFunc: func(ctx context.Context, initPayload transport.InitPayload) (context.Context, *transport.InitPayload, error) {
			var auth string
			if val, ok := initPayload["Authorization"].(string); ok {
				auth = val
			} else if val, ok := initPayload["authorization"].(string); ok {
				auth = val
			}

			if auth == "" {
				return ctx, nil, nil
			}

			tokenStr := strings.TrimPrefix(auth, "Bearer ")
			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				return []byte(cfg.Auth.JWT.Secret), nil
			})

			if err != nil || !token.Valid {
				return ctx, nil, nil
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				return ctx, nil, nil
			}

			uidStr, _ := claims["sub"].(string)
			isBot, _ := claims["is_bot"].(bool)
			uid, _ := uuid.Parse(uidStr)

			newCtx := context.WithValue(ctx, middleware.AuthUserIDKey, uidStr)

			if !isBot {
				sidStr, _ := claims["sid"].(string)
				sid, _ := uuid.Parse(sidStr)

				checkCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
				defer cancel()

				_, err = db.Queries.GetActiveSession(checkCtx, dbgen.GetActiveSessionParams{
					ID:     sid,
					UserID: uid,
				})
				if err != nil {
					return nil, nil, fmt.Errorf("session expired")
				}
				newCtx = context.WithValue(newCtx, middleware.AuthSessionIDKey, sidStr)
			}

			l := loaders.NewLoaders(res.UserClient, res.PresenceClient, db.Queries)
			newCtx = loaders.AttachToContext(newCtx, l)

			go func(userID string, socketCtx context.Context) {
				ticker := time.NewTicker(20 * time.Second)
				defer ticker.Stop()

				initialCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
				_, _ = res.PresenceClient.SetOnline(initialCtx, &presencepb.SetOnlineRequest{UserId: userID})
				cancel()

				for {
					select {
					case <-ticker.C:
						tCtx, tCancel := context.WithTimeout(context.Background(), 5*time.Second)
						_, _ = res.PresenceClient.SetOnline(tCtx, &presencepb.SetOnlineRequest{UserId: userID})
						tCancel()
					case <-socketCtx.Done():
						offCtx, offCancel := context.WithTimeout(context.Background(), 5*time.Second)
						_, _ = res.PresenceClient.SetOffline(offCtx, &presencepb.SetOfflineRequest{UserId: userID})
						offCancel()
						return
					}
				}
			}(uidStr, newCtx)

			return newCtx, nil, nil
		},
	})

	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})
	srv.AddTransport(transport.MultipartForm{})

	return srv
}
