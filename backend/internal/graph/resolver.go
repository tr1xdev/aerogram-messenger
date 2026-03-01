package graph

import (
	authpb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/auth/v1"
	chatpb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/chat/v1"
	messagespb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/messages/v1"
	userpb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/user/v1"
	"github.com/aerogram-org/aerogram-api/internal/repositories"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type Resolver struct {
	db             *gorm.DB
	userRepo       *repositories.UserRepository
	presenceRepo   *repositories.PresenceRepository
	authClient     authpb.AuthServiceClient
	chatClient     chatpb.ChatServiceClient
	messagesClient messagespb.MessagesServiceClient
	userClient     userpb.UserServiceClient
	redisClient    *redis.Client
}

func NewResolver(
	db *gorm.DB,
	userRepo *repositories.UserRepository,
	authClient authpb.AuthServiceClient,
	chatClient chatpb.ChatServiceClient,
	messagesClient messagespb.MessagesServiceClient,
	userClient userpb.UserServiceClient,
	redisClient *redis.Client,
	presenceRepo *repositories.PresenceRepository,
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
	}
}
