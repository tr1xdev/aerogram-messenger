package api

import (
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/go-chi/chi/v5"
	"github.com/redis/go-redis/v9"
	"github.com/tr1xdev/aerogram-messenger/internal/config"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/helpers"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/loaders"
	presencev1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/presence/v1"
	userv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/user/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/infrastructure/storage"
	"github.com/tr1xdev/aerogram-messenger/internal/middleware"
)

type RouterConfig struct {
	Cfg            *config.Config
	DB             *database.DB
	RDB            *redis.Client
	UserClient     userv1.UserServiceClient
	PresenceClient presencev1.PresenceServiceClient
	Storage        storage.Provider
	GQLServer      *handler.Server
	Enricher       *helpers.ChatEnricher
}

func NewRouter(c RouterConfig) *chi.Mux {
	r := chi.NewRouter()

	r.Use(middleware.H3AltSvc(8080))
	r.Use(middleware.Cors())
	r.Use(loaders.LoaderMiddleware(
		c.UserClient,
		c.PresenceClient,
		c.DB.Queries,
		c.Enricher,
	))
	r.Use(middleware.AuthMiddleware(c.Cfg, c.DB))

	r.Group(func(r chi.Router) {
		r.Use(middleware.RateLimit(
			c.RDB,
			c.Cfg.RateLimit.Global.Limit,
			time.Second,
		))
		r.Handle("/query", c.GQLServer)
	})

	return r
}
