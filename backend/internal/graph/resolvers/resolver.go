package resolvers

import (
	"github.com/redis/go-redis/v9"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/helpers" // Импортируем хелперы
	authpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/auth/v1"
	chatpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/chat/v1"
	messagespb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/messages/v1"
	presencepb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/presence/v1"
	userpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/user/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/infrastructure/storage"
	"github.com/tr1xdev/aerogram-messenger/internal/services/geo_svc"
	"github.com/tr1xdev/aerogram-messenger/internal/services/presence_svc"
	"github.com/tr1xdev/aerogram-messenger/internal/services/ua_svc"
)

type Resolver struct {
	DB             *database.DB
	Store          dbgen.Querier
	AuthClient     authpb.AuthServiceClient
	ChatClient     chatpb.ChatServiceClient
	MessagesClient messagespb.MessagesServiceClient
	UserClient     userpb.UserServiceClient
	PresenceClient presencepb.PresenceServiceClient
	PresenceSvc    *presence_svc.Server
	RedisClient    *redis.Client
	GeoService     *geo_svc.Service
	UaService      *ua_svc.Service
	Storage        *storage.S3Storage
	Enricher       *helpers.ChatEnricher
}

func NewResolver(
	db *database.DB,
	store dbgen.Querier,
	authClient authpb.AuthServiceClient,
	chatClient chatpb.ChatServiceClient,
	messagesClient messagespb.MessagesServiceClient,
	userClient userpb.UserServiceClient,
	presenceClient presencepb.PresenceServiceClient,
	presenceSvc *presence_svc.Server,
	redisClient *redis.Client,
	geoService *geo_svc.Service,
	uaService *ua_svc.Service,
	storage *storage.S3Storage,
) *Resolver {
	return &Resolver{
		DB:             db,
		Store:          store,
		AuthClient:     authClient,
		ChatClient:     chatClient,
		MessagesClient: messagesClient,
		UserClient:     userClient,
		PresenceClient: presenceClient,
		PresenceSvc:    presenceSvc,
		RedisClient:    redisClient,
		GeoService:     geoService,
		UaService:      uaService,
		Storage:        storage,
		Enricher:       helpers.NewChatEnricher(store, storage),
	}
}
