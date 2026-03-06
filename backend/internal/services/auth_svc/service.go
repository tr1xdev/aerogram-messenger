package auth_svc

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/tr1xdev/aerogram-messenger/internal/config"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	authpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/auth/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/repositories"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type Server struct {
	authpb.UnimplementedAuthServiceServer
	authRepo *repositories.AuthRepository
	userRepo *repositories.UserRepository
	cfg      *config.Config
	db       *database.DB
}

func NewServer(db *database.DB, rdb *redis.Client, mailer repositories.EmailProvider, cfg *config.Config) *Server {
	return &Server{
		db:       db,
		authRepo: repositories.NewAuthRepository(db, rdb, mailer, 10*time.Minute),
		userRepo: repositories.NewUserRepository(db),
		cfg:      cfg,
	}
}

func (s *Server) getMetadata(ctx context.Context) (string, string) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return "unknown", "unknown"
	}
	ip, ua := "unknown", "unknown"
	if v := md.Get("x-real-ip"); len(v) > 0 {
		ip = v[0]
	}
	if v := md.Get("x-client-device"); len(v) > 0 {
		ua = v[0]
	} else if v := md.Get("user-agent"); len(v) > 0 {
		ua = v[0]
	}
	return ip, ua
}

func (s *Server) createAccessToken(userID, sessionID string, verified bool) (string, error) {
	ttl := s.cfg.JWT.TTL()
	if ttl == 0 {
		ttl = time.Hour * 24
	}

	claims := jwt.MapClaims{
		"sub":      userID,
		"sid":      sessionID,
		"verified": verified,
		"exp":      time.Now().Add(ttl).Unix(),
		"iat":      time.Now().Unix(),
	}

	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString([]byte(s.cfg.JWT.Secret))
}

func (s *Server) SignUp(ctx context.Context, req *authpb.SignUpRequest) (*authpb.SignUpResponse, error) {
	if req.Email == "" || req.FirstName == "" || req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "required fields missing")
	}

	pwHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to process password")
	}

	newID := uuid.New()
	params := dbgen.CreateUserParams{
		ID:        newID,
		Email:     req.Email,
		FirstName: req.FirstName,
		Password:  string(pwHash),
		Status:    "OFFLINE",
		LastName:  database.ToNullString(req.LastName),
		Username:  database.ToNullString(req.Username),
	}

	if _, err := s.userRepo.CreateUser(ctx, params); err != nil {
		errStr := err.Error()
		if strings.Contains(errStr, "23505") || strings.Contains(errStr, "unique constraint") {
			if strings.Contains(errStr, "email") {
				return nil, status.Error(codes.AlreadyExists, "email already registered")
			}
			if strings.Contains(errStr, "username") {
				return nil, status.Error(codes.AlreadyExists, "username already taken")
			}
		}
		return nil, status.Error(codes.Internal, "storage error")
	}

	verID := uuid.NewString()
	targetEmail := req.Email
	if os.Getenv("APP_ENV") == "development" {
		if testEmail := os.Getenv("TEST_EMAIL"); testEmail != "" {
			targetEmail = testEmail
		}
	}

	fmt.Printf("[AUTH] Created User: %s, Email: %s, VerID: %s\n", newID.String(), req.Email, verID)

	if err := s.authRepo.StoreAndSendCode(ctx, verID, newID.String(), targetEmail, req.FirstName); err != nil {
		fmt.Printf("DEBUG: skip email error: %v\n", err)
	}

	return &authpb.SignUpResponse{UserId: verID}, nil
}

func (s *Server) Login(ctx context.Context, req *authpb.LoginRequest) (*authpb.LoginResponse, error) {
	if req.Email == "" || req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "email and password required")
	}

	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid credentials")
	}

	verID := uuid.NewString()
	if err := s.authRepo.StoreAndSendCode(ctx, verID, user.ID.String(), user.Email, user.FirstName); err != nil {
		if os.Getenv("APP_ENV") != "development" {
			return nil, status.Error(codes.Internal, "email delivery failed")
		}
	}

	return &authpb.LoginResponse{UserId: verID}, nil
}

func (s *Server) VerifyEmail(ctx context.Context, req *authpb.VerifyEmailRequest) (*authpb.VerifyEmailResponse, error) {
	realUserIDStr, err := s.authRepo.VerifyCode(ctx, req.UserId, req.Code)
	if err != nil {
		return nil, status.Error(codes.PermissionDenied, err.Error())
	}

	uid, err := uuid.Parse(realUserIDStr)
	if err != nil {
		return nil, status.Error(codes.Internal, "invalid user identity")
	}

	ip, ua := s.getMetadata(ctx)
	sid := uuid.New()

	tx, err := s.db.Conn.BeginTx(ctx, nil)
	if err != nil {
		return nil, status.Error(codes.Internal, "tx error")
	}
	defer tx.Rollback()

	qtx := s.db.Queries.WithTx(tx)

	_, err = qtx.CreateSession(ctx, dbgen.CreateSessionParams{
		ID:        sid,
		UserID:    uid,
		IpAddress: ip,
		Device:    ua,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "session creation failed")
	}

	token, err := s.createAccessToken(uid.String(), sid.String(), true)
	if err != nil {
		return nil, status.Error(codes.Internal, "token error")
	}

	if err := tx.Commit(); err != nil {
		return nil, status.Error(codes.Internal, "commit error")
	}

	return &authpb.VerifyEmailResponse{
		AccessToken:  token,
		RefreshToken: sid.String(),
	}, nil
}

func (s *Server) RefreshToken(ctx context.Context, req *authpb.RefreshTokenRequest) (*authpb.RefreshTokenResponse, error) {
	sid, err := uuid.Parse(req.RefreshToken)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid token format")
	}

	session, err := s.db.Queries.GetActiveSession(ctx, dbgen.GetActiveSessionParams{
		ID:     sid,
		UserID: uuid.Nil,
	})
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "session expired or not found")
	}

	token, err := s.createAccessToken(session.UserID.String(), session.ID.String(), true)
	if err != nil {
		return nil, status.Error(codes.Internal, "token generation failed")
	}

	return &authpb.RefreshTokenResponse{
		AccessToken:  token,
		RefreshToken: session.ID.String(),
	}, nil
}
