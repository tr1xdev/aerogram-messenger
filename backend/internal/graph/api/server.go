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
			auth, ok := initPayload["Authorization"].(string)
			if !ok || auth == "" {
				return ctx, nil, nil
			}

			tokenStr := strings.TrimPrefix(auth, "Bearer ")
			token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
				return []byte(cfg.JWT.Secret), nil
			})

			if err != nil || !token.Valid {
				return ctx, nil, nil
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				return ctx, nil, nil
			}

			uidStr, _ := claims["sub"].(string)
			sidStr, _ := claims["sid"].(string)
			uid, errUID := uuid.Parse(uidStr)
			sid, errSID := uuid.Parse(sidStr)
			if errUID != nil || errSID != nil {
				return ctx, nil, nil
			}

			checkCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
			defer cancel()

			_, err = db.Queries.GetActiveSession(checkCtx, dbgen.GetActiveSessionParams{
				ID:     sid,
				UserID: uid,
			})
			if err != nil {
				return nil, nil, fmt.Errorf("session expired or invalid")
			}

			newCtx := context.WithValue(ctx, middleware.AuthUserIDKey, uidStr)
			newCtx = context.WithValue(newCtx, middleware.AuthSessionIDKey, sidStr)

			l := loaders.NewLoaders(res.UserClient, res.PresenceClient, db.Queries)
			newCtx = loaders.AttachToContext(newCtx, l)

			go func(userID string, socketCtx context.Context) {
				ticker := time.NewTicker(20 * time.Second)
				defer ticker.Stop()

				_, _ = res.PresenceClient.SetOnline(context.Background(), &presencepb.SetOnlineRequest{
					UserId: userID,
				})

				for {
					select {
					case <-ticker.C:
						_, _ = res.PresenceClient.SetOnline(context.Background(), &presencepb.SetOnlineRequest{
							UserId: userID,
						})
					case <-socketCtx.Done():
						_, _ = res.PresenceClient.SetOffline(context.Background(), &presencepb.SetOfflineRequest{
							UserId: userID,
						})
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
