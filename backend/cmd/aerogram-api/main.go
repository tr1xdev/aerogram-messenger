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
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/tr1xdev/aerogram-messenger/internal/api"
	"github.com/tr1xdev/aerogram-messenger/internal/config"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	graph_api "github.com/tr1xdev/aerogram-messenger/internal/graph/api"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/loaders"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/resolvers"
	"github.com/tr1xdev/aerogram-messenger/internal/infrastructure/mailer"
	"github.com/tr1xdev/aerogram-messenger/internal/middleware"
	"github.com/tr1xdev/aerogram-messenger/internal/repositories"
	"github.com/tr1xdev/aerogram-messenger/internal/services/auth_svc"
	"github.com/tr1xdev/aerogram-messenger/internal/services/chat_svc"
	"github.com/tr1xdev/aerogram-messenger/internal/services/geo_svc"
	"github.com/tr1xdev/aerogram-messenger/internal/services/messages_svc"
	"github.com/tr1xdev/aerogram-messenger/internal/services/presence_svc"
	"github.com/tr1xdev/aerogram-messenger/internal/services/ua_svc"
	"github.com/tr1xdev/aerogram-messenger/internal/services/user_svc"

	authv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/auth/v1"
	chatv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/chat/v1"
	messagesv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/messages/v1"
	presencev1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/presence/v1"
	userv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/user/v1"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	db, err := database.NewPostgres(cfg.PostgresDSN())
	if err != nil {
		log.Fatalf("failed to connect to postgres: %v", err)
	}
	defer db.Close()

	rdb := database.NewRedis(cfg.RedisAddr(), cfg.RedisPassword(), 0)
	defer rdb.Close()

	pRepo := repositories.NewPresenceRepository(rdb)

	templatePath := "internal/templates/verification.html"
	emailSvc, err := mailer.NewResendService(cfg.Resend.Token, cfg.Resend.From, templatePath)
	if err != nil {
		log.Printf("Warning: mailer init error: %v", err)
	}

	geoSvc := geo_svc.New("assets/GeoLite2-City.mmdb")
	defer geoSvc.Close()
	uaSvc := ua_svc.New()

	grpcAddr := fmt.Sprintf("%s:%d", cfg.Server.GRPC.Host, cfg.Server.GRPC.Port)
	grpcLis, err := net.Listen("tcp", grpcAddr)
	if err != nil {
		log.Fatalf("failed to listen grpc: %v", err)
	}

	grpcServer := grpc.NewServer()
	registerGRPCServices(grpcServer, db, rdb, emailSvc, cfg, pRepo)

	go func() {
		log.Printf("gRPC server listening on %s", grpcAddr)
		if err := grpcServer.Serve(grpcLis); err != nil && err != grpc.ErrServerStopped {
			log.Fatalf("grpc serve error: %v", err)
		}
	}()

	conn, err := grpc.NewClient(grpcAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("failed to create grpc client: %v", err)
	}
	defer conn.Close()

	router := chi.NewRouter()
	applyMiddleware(router, cfg, db, conn, rdb)

	gqlServer := initGraphQL(db, rdb, conn, cfg, geoSvc, uaSvc)
	api.SetupRoutes(router, gqlServer)

	httpAddr := fmt.Sprintf("%s:%d", cfg.Server.HTTP.Host, cfg.Server.HTTP.Port)
	httpServer := &http.Server{
		Addr:    httpAddr,
		Handler: router,
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("HTTP server listening on %s", httpAddr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("http listen error: %v", err)
		}
	}()

	<-stop
	log.Println("Shutting down gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Printf("HTTP shutdown error: %v", err)
	}
	grpcServer.GracefulStop()
	log.Println("Server stopped")
}

func registerGRPCServices(s *grpc.Server, db *database.DB, rdb *redis.Client, mailer repositories.EmailProvider, cfg *config.Config, pRepo *repositories.PresenceRepository) {
	authv1.RegisterAuthServiceServer(s, auth_svc.NewServer(db, rdb, mailer, cfg))
	chatv1.RegisterChatServiceServer(s, chat_svc.NewServer(db))
	messagesv1.RegisterMessagesServiceServer(s, messages_svc.NewServer(db, rdb))
	presencev1.RegisterPresenceServiceServer(s, presence_svc.NewServer(pRepo))
	userv1.RegisterUserServiceServer(s, user_svc.NewServer(db))
}

func applyMiddleware(r *chi.Mux, cfg *config.Config, db *database.DB, conn *grpc.ClientConn, rdb *redis.Client) {
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Apollo-Operation-Name", "Apollo-Require-Preflight"},
		AllowCredentials: true,
	}))

	userClient := userv1.NewUserServiceClient(conn)
	presenceClient := presencev1.NewPresenceServiceClient(conn)
	r.Use(loaders.LoaderMiddleware(userClient, presenceClient, db.Queries))
	r.Use(middleware.AuthMiddleware(cfg, db))
}

func initGraphQL(
	db *database.DB,
	rdb *redis.Client,
	conn *grpc.ClientConn,
	cfg *config.Config,
	geoSvc *geo_svc.Service,
	uaSvc *ua_svc.Service,
) *handler.Server {
	resolver := resolvers.NewResolver(
		db,
		db.Queries,
		authv1.NewAuthServiceClient(conn),
		chatv1.NewChatServiceClient(conn),
		messagesv1.NewMessagesServiceClient(conn),
		userv1.NewUserServiceClient(conn),
		presencev1.NewPresenceServiceClient(conn),
		rdb,
		geoSvc,
		uaSvc,
	)

	return graph_api.NewGraphQLServer(resolver, cfg, db)
}
