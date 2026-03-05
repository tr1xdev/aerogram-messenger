package graph

import (
	"github.com/redis/go-redis/v9"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	authpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/auth/v1"
	chatpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/chat/v1"
	messagespb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/messages/v1"
	userpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/user/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/repositories"
	"github.com/tr1xdev/aerogram-messenger/internal/services/geo_svc"
	"github.com/tr1xdev/aerogram-messenger/internal/services/ua_svc"
)

type Resolver struct {
	db             *database.DB
	userRepo       *repositories.UserRepository
	presenceRepo   *repositories.PresenceRepository
	authClient     authpb.AuthServiceClient
	chatClient     chatpb.ChatServiceClient
	messagesClient messagespb.MessagesServiceClient
	userClient     userpb.UserServiceClient
	redisClient    *redis.Client
	geoService     *geo_svc.Service
	uaService      *ua_svc.Service
}

func NewResolver(
	db *database.DB,
	userRepo *repositories.UserRepository,
	authClient authpb.AuthServiceClient,
	chatClient chatpb.ChatServiceClient,
	messagesClient messagespb.MessagesServiceClient,
	userClient userpb.UserServiceClient,
	redisClient *redis.Client,
	presenceRepo *repositories.PresenceRepository,
	geoService *geo_svc.Service,
	uaService *ua_svc.Service,
) *Resolver {
	return &Resolver{
		db:             db,
		userRepo:       userRepo,
		authClient:     authClient,
		chatClient:     chatClient,
		messagesClient: messagesClient,
		userClient:     userClient,
		redisClient:    redisClient,
		presenceRepo:   presenceRepo,
		geoService:     geoService,
		uaService:      uaService,
	}
}
