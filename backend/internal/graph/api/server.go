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
	"github.com/tr1xdev/aerogram-messenger/internal/graph/resolvers"
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

			uid, _ := uuid.Parse(claims["sub"].(string))
			sid, _ := uuid.Parse(claims["sid"].(string))

			_, err = db.Queries.GetActiveSession(ctx, dbgen.GetActiveSessionParams{
				ID:     sid,
				UserID: uid,
			})
			if err != nil {
				return nil, nil, fmt.Errorf("session expired or invalid")
			}

			newCtx := context.WithValue(ctx, middleware.AuthUserIDKey, uid.String())
			newCtx = context.WithValue(newCtx, middleware.AuthSessionIDKey, sid.String())

			return newCtx, nil, nil
		},
	})

	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})
	srv.AddTransport(transport.MultipartForm{})

	return srv
}
