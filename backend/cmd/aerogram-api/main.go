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
	"github.com/quic-go/quic-go/http3"
	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/tr1xdev/aerogram-messenger/internal/api"
	"github.com/tr1xdev/aerogram-messenger/internal/config"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	graph_api "github.com/tr1xdev/aerogram-messenger/internal/graph/api"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/resolvers"
	"github.com/tr1xdev/aerogram-messenger/internal/infrastructure/limiter"
	"github.com/tr1xdev/aerogram-messenger/internal/infrastructure/mailer"
	"github.com/tr1xdev/aerogram-messenger/internal/infrastructure/storage"
	internal_tls "github.com/tr1xdev/aerogram-messenger/internal/infrastructure/tls"
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

	if err := db.RunMigrations(); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	rdb := database.NewRedis(cfg.RedisAddr(), cfg.Database.Redis.Password, cfg.Database.Redis.DB)
	defer rdb.Close()

	pRepo := repositories.NewPresenceRepository(rdb)
	pSvc := presence_svc.NewServer(pRepo)

	templatePath := "internal/templates/verification.html"
	emailSvc, err := mailer.NewResendService(cfg.Auth.JWT.Secret, cfg.App.TestEmail, templatePath)
	if err != nil {
		log.Printf("Warning: mailer init error: %v", err)
	}

	geoSvc := geo_svc.New("assets/GeoLite2-City.mmdb")
	defer geoSvc.Close()
	uaSvc := ua_svc.New()

	ctx := context.Background()
	s3Storage, err := storage.NewS3Storage(
		ctx,
		cfg.S3.Endpoint,
		cfg.S3.AccessKey,
		cfg.S3.SecretKey,
		cfg.S3.Bucket,
		cfg.S3.PublicHost,
	)
	if err != nil {
		log.Fatalf("failed to init s3 storage: %v", err)
	}

	grpcAddr := fmt.Sprintf("%s:%d", cfg.Server.GRPC.Host, cfg.Server.GRPC.Port)
	grpcLis, err := net.Listen("tcp", grpcAddr)
	if err != nil {
		log.Fatalf("failed to listen grpc: %v", err)
	}

	grpcServer := grpc.NewServer()
	registerGRPCServices(grpcServer, db, rdb, emailSvc, cfg, pSvc)

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

	gqlServer := initGraphQL(db, rdb, conn, cfg, geoSvc, uaSvc, pSvc, s3Storage)

	router := api.NewRouter(api.RouterConfig{
		Cfg:            cfg,
		DB:             db,
		RDB:            rdb,
		GQLServer:      gqlServer,
		UserClient:     userv1.NewUserServiceClient(conn),
		PresenceClient: presencev1.NewPresenceServiceClient(conn),
	})

	certPath := os.Getenv("TLS_CERT_PATH")
	if certPath == "" {
		certPath = "certs/localhost+2.pem"
	}
	keyPath := os.Getenv("TLS_KEY_PATH")
	if keyPath == "" {
		keyPath = "certs/localhost+2-key.pem"
	}

	tlsConfig := internal_tls.LoadServerConfig(certPath, keyPath)
	httpAddr := fmt.Sprintf("%s:%d", cfg.Server.HTTP.Host, cfg.Server.HTTP.Port)

	httpServer := &http.Server{
		Addr:         httpAddr,
		Handler:      router,
		TLSConfig:    tlsConfig,
		ReadTimeout:  cfg.Server.HTTP.Timeout.Read,
		WriteTimeout: cfg.Server.HTTP.Timeout.Write,
		IdleTimeout:  cfg.Server.HTTP.Timeout.Idle,
	}

	h3Server := &http3.Server{
		Addr:      httpAddr,
		Handler:   router,
		TLSConfig: tlsConfig,
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("HTTP/2 (TCP) listening on %s", httpAddr)
		if err := httpServer.ListenAndServeTLS("", ""); err != nil && err != http.ErrServerClosed {
			log.Printf("http2 listen error: %v", err)
		}
	}()

	go func() {
		log.Printf("HTTP/3 (UDP) listening on %s", httpAddr)
		if err := h3Server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("http3 listen error: %v", err)
		}
	}()

	<-stop
	log.Println("Shutting down gracefully...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	shutdownDone := make(chan struct{})

	go func() {
		if err := httpServer.Shutdown(shutdownCtx); err != nil {
			log.Printf("HTTP/2 shutdown error: %v", err)
		}

		if err := h3Server.Close(); err != nil {
			log.Printf("HTTP/3 close error: %v", err)
		}

		grpcDone := make(chan struct{})
		go func() {
			grpcServer.GracefulStop()
			close(grpcDone)
		}()

		select {
		case <-grpcDone:
			log.Println("gRPC server stopped gracefully")
		case <-shutdownCtx.Done():
			log.Println("gRPC shutdown timeout, forcing stop")
			grpcServer.Stop()
		}

		close(shutdownDone)
	}()

	select {
	case <-shutdownDone:
		log.Println("All services stopped cleanly")
	case <-shutdownCtx.Done():
		log.Println("Shutdown timeout exceeded, forcing exit")
	}

	log.Println("Server stopped")
}

func registerGRPCServices(s *grpc.Server, db *database.DB, rdb *redis.Client, mailer repositories.EmailProvider, cfg *config.Config, pSvc *presence_svc.Server) {
	authLimiter := limiter.NewRedisLimiter(rdb)

	authv1.RegisterAuthServiceServer(s, auth_svc.NewServer(db, authLimiter, rdb, mailer, cfg))

	chatv1.RegisterChatServiceServer(s, chat_svc.NewServer(
		db,
		rdb,
		authLimiter,
		cfg.RateLimit.Chat,
	))

	messagesv1.RegisterMessagesServiceServer(s, messages_svc.NewServer(db, rdb, authLimiter, cfg.RateLimit.Messages))
	presencev1.RegisterPresenceServiceServer(s, pSvc)

	userv1.RegisterUserServiceServer(s, user_svc.NewServer(db, authLimiter, cfg))
}

func initGraphQL(
	db *database.DB,
	rdb *redis.Client,
	conn *grpc.ClientConn,
	cfg *config.Config,
	geoSvc *geo_svc.Service,
	uaSvc *ua_svc.Service,
	pSvc *presence_svc.Server,
	s3Storage *storage.S3Storage,
) *handler.Server {
	resolver := resolvers.NewResolver(
		db,
		db.Queries,
		authv1.NewAuthServiceClient(conn),
		chatv1.NewChatServiceClient(conn),
		messagesv1.NewMessagesServiceClient(conn),
		userv1.NewUserServiceClient(conn),
		presencev1.NewPresenceServiceClient(conn),
		pSvc,
		rdb,
		geoSvc,
		uaSvc,
		s3Storage,
	)

	return graph_api.NewGraphQLServer(resolver, cfg, db)
}
