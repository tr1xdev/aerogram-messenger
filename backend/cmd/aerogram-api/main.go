package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/lru"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/aerogram-org/aerogram-api/internal/api"
	"github.com/aerogram-org/aerogram-api/internal/config"
	"github.com/aerogram-org/aerogram-api/internal/database"
	"github.com/aerogram-org/aerogram-api/internal/graph"
	"github.com/aerogram-org/aerogram-api/internal/handlers"
	"github.com/aerogram-org/aerogram-api/internal/middleware"
	"github.com/aerogram-org/aerogram-api/internal/models"
	"github.com/aerogram-org/aerogram-api/internal/repositories"
	"github.com/aerogram-org/aerogram-api/internal/services/auth_svc"
	"github.com/aerogram-org/aerogram-api/internal/services/chat_svc"
	"github.com/aerogram-org/aerogram-api/internal/services/messages_svc"
	"github.com/aerogram-org/aerogram-api/internal/services/presence_svc"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
	"github.com/vektah/gqlparser/v2/ast"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"gorm.io/gorm"

	authpb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/auth/v1"
	chatpb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/chat/v1"
	messagespb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/messages/v1"
	presencepb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/presence/v1"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	db, err := database.NewPostgres(cfg.PostgresDSN())
	if err != nil {
		log.Fatal(err)
	}

	rdb := database.NewRedis(cfg.RedisAddr(), cfg.RedisPassword(), 0)
	userRepo := repositories.NewUserRepository(db)
	presenceRepo := repositories.NewPresenceRepository(rdb)

	db.AutoMigrate(&models.User{}, &models.Message{}, &models.Session{}, &models.Dialog{}, &models.DialogMember{})

	grpcAddr := fmt.Sprintf("%s:%d", cfg.Server.GRPC.Host, cfg.Server.GRPC.Port)
	grpcLis, err := net.Listen("tcp", grpcAddr)
	if err != nil {
		log.Fatal(err)
	}

	grpcServer := grpc.NewServer()
	initGRPC(grpcServer, db, rdb, cfg, presenceRepo)

	go func() {
		if err := grpcServer.Serve(grpcLis); err != nil && err != grpc.ErrServerStopped {
			log.Fatalf("gRPC error: %v", err)
		}
	}()

	conn, err := grpc.NewClient(grpcAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal(err)
	}

	srv := initGraphQL(db, userRepo, rdb, presenceRepo, conn)
	router := chi.NewRouter()

	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Apollo-Operation-Name", "Apollo-Require-Preflight"},
		AllowCredentials: true,
	}))

	router.Use(middleware.AuthMiddleware(cfg))
	router.Get("/ws/presence", handlers.HandlePresence(presenceRepo))
	api.SetupRoutes(router, srv)

	httpServer := &http.Server{
		Addr:    fmt.Sprintf("%s:%d", cfg.Server.HTTP.Host, cfg.Server.HTTP.Port),
		Handler: router,
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("HTTP server on %s", httpServer.Addr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP error: %v", err)
		}
	}()

	<-stop
	log.Println("Shutting down servers...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Printf("HTTP shutdown error: %v", err)
	}
	log.Println("HTTP server stopped")

	grpcServer.GracefulStop()
	log.Println("gRPC server stopped")

	conn.Close()

	sqlDB, _ := db.DB()
	if sqlDB != nil {
		sqlDB.Close()
		log.Println("Database connection closed")
	}

	rdb.Close()
	log.Println("Redis connection closed")
}

func initGRPC(s *grpc.Server, db *gorm.DB, rdb *redis.Client, cfg *config.Config, pRepo *repositories.PresenceRepository) {
	authpb.RegisterAuthServiceServer(s, auth_svc.NewServer(db, rdb, cfg))
	chatpb.RegisterChatServiceServer(s, chat_svc.NewServer(db))
	messagespb.RegisterMessagesServiceServer(s, messages_svc.NewServer(db, rdb))
	presencepb.RegisterPresenceServiceServer(s, presence_svc.NewServer(pRepo))
}

func initGraphQL(db *gorm.DB, uRepo *repositories.UserRepository, rdb *redis.Client, pRepo *repositories.PresenceRepository, conn *grpc.ClientConn) *handler.Server {
	authClient := authpb.NewAuthServiceClient(conn)
	chatClient := chatpb.NewChatServiceClient(conn)
	msgClient := messagespb.NewMessagesServiceClient(conn)

	resolver := graph.NewResolver(db, uRepo, authClient, chatClient, msgClient, rdb, pRepo)
	schema := graph.NewExecutableSchema(graph.Config{Resolvers: resolver})
	srv := handler.New(schema)

	srv.AddTransport(transport.Websocket{
		KeepAlivePingInterval: 10 * time.Second,
		Upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
	})
	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})
	srv.AddTransport(transport.MultipartForm{})

	srv.SetQueryCache(lru.New[*ast.QueryDocument](1000))
	srv.Use(extension.Introspection{})

	return srv
}
