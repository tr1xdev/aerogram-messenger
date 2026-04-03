package auth_svc

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/tr1xdev/aerogram-messenger/internal/config"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	authpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/auth/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/infrastructure/limiter"
	"github.com/tr1xdev/aerogram-messenger/internal/repositories"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type Server struct {
	authpb.UnimplementedAuthServiceServer
	authRepo    *repositories.AuthRepository
	authLimiter limiter.RateLimiter
	userRepo    *repositories.UserRepository
	cfg         *config.Config
	db          *database.DB
	rdb         *redis.Client
}

type pendingUser struct {
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name,omitempty"`
	Username  string `json:"username,omitempty"`
	Password  string `json:"password"`
}

func NewServer(db *database.DB, authLimiter limiter.RateLimiter, rdb *redis.Client, mailer repositories.EmailProvider, cfg *config.Config) *Server {
	return &Server{
		db:          db,
		authLimiter: authLimiter,
		authRepo:    repositories.NewAuthRepository(db, rdb, mailer, cfg.Auth.TwoFA.CodeTTL),
		userRepo:    repositories.NewUserRepository(db),
		cfg:         cfg,
		rdb:         rdb,
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

func (s *Server) createAccessToken(userID, sessionID string, verified bool, isBot bool) (string, error) {
	var ttl time.Duration
	if isBot {
		ttl = time.Hour * 24 * 365
	} else {
		ttl = s.cfg.Auth.JWT.AccessTTL
		if ttl == 0 {
			ttl = time.Hour * 24
		}
	}

	claims := jwt.MapClaims{
		"sub":      userID,
		"verified": verified,
		"is_bot":   isBot,
		"exp":      time.Now().Add(ttl).Unix(),
		"iat":      time.Now().Unix(),
	}

	if sessionID != "" {
		claims["sid"] = sessionID
	}

	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString([]byte(s.cfg.Auth.JWT.Secret))
}

func (s *Server) SignUp(ctx context.Context, req *authpb.SignUpRequest) (*authpb.SignUpResponse, error) {
	ip, _ := s.getMetadata(ctx)

	limitCfg := s.cfg.RateLimit.Auth.SignUp
	allowed, err := s.authLimiter.Allow(ctx, "limit:signup:"+ip, limitCfg.Limit, limitCfg.Window)
	if err != nil {
		return nil, status.Error(codes.Internal, "limiter error")
	}
	if !allowed {
		return nil, status.Error(codes.ResourceExhausted, "too many registration attempts from this IP")
	}

	if req.Email == "" || req.FirstName == "" || req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "required fields missing")
	}

	_, err = s.userRepo.GetByEmail(ctx, req.Email)
	if err == nil {
		return nil, status.Error(codes.AlreadyExists, "email already registered")
	}

	pwHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to process password")
	}

	var lName, uName string
	if req.LastName != nil {
		lName = *req.LastName
	}
	if req.Username != nil {
		uName = *req.Username
	}

	if !s.cfg.Auth.TwoFA.Enabled || !s.cfg.Auth.TwoFA.OnSignUp {
		newID := uuid.New()
		params := dbgen.CreateUserParams{
			ID:        newID,
			Email:     sql.NullString{String: req.Email, Valid: true},
			FirstName: req.FirstName,
			Password:  sql.NullString{String: string(pwHash), Valid: true},
			Status:    "OFFLINE",
			LastName:  database.ToNullString(&lName),
			Username:  database.ToNullString(&uName),
		}

		if _, err := s.userRepo.CreateUser(ctx, params); err != nil {
			return nil, status.Error(codes.Internal, "storage error")
		}

		sid := uuid.New()
		_, err = s.db.Queries.CreateSession(ctx, dbgen.CreateSessionParams{
			ID:        sid,
			UserID:    newID,
			IpAddress: ip,
			Device:    "unknown",
		})
		if err != nil {
			return nil, status.Error(codes.Internal, "session creation failed")
		}

		token, err := s.createAccessToken(newID.String(), sid.String(), true, false)
		if err != nil {
			return nil, status.Error(codes.Internal, "token error")
		}

		return &authpb.SignUpResponse{
			UserId:       newID.String(),
			AccessToken:  &token,
			RefreshToken: &[]string{sid.String()}[0],
		}, nil
	}

	verID := uuid.NewString()
	pending := pendingUser{
		Email:     req.Email,
		FirstName: req.FirstName,
		LastName:  lName,
		Username:  uName,
		Password:  string(pwHash),
	}

	data, _ := json.Marshal(pending)
	err = s.rdb.Set(ctx, "pending_reg:"+verID, data, s.cfg.Auth.TwoFA.CodeTTL).Err()
	if err != nil {
		return nil, status.Error(codes.Internal, "cache error")
	}

	targetEmail := req.Email
	if s.cfg.App.Env == "development" && s.cfg.App.TestEmail != "" {
		targetEmail = s.cfg.App.TestEmail
	}

	go func(vID, email, name string) {
		asyncCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		if err := s.authRepo.StoreAndSendCode(asyncCtx, vID, "PENDING", email, name); err != nil {
			fmt.Printf("ASYNC MAIL ERROR: %v\n", err)
		}
	}(verID, targetEmail, req.FirstName)

	return &authpb.SignUpResponse{UserId: verID}, nil
}

func (s *Server) Login(ctx context.Context, req *authpb.LoginRequest) (*authpb.LoginResponse, error) {
	limitCfg := s.cfg.RateLimit.Auth.Login
	allowed, err := s.authLimiter.Allow(ctx, "limit:login:"+req.Email, limitCfg.Limit, limitCfg.Window)
	if err != nil {
		return nil, status.Error(codes.Internal, "limiter error")
	}
	if !allowed {
		return nil, status.Error(codes.ResourceExhausted, "too many login attempts")
	}

	if req.Email == "" || req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "email and password required")
	}

	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password.String), []byte(req.Password)); err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid credentials")
	}

	if !s.cfg.Auth.TwoFA.Enabled || !s.cfg.Auth.TwoFA.OnSignIn {
		ip, ua := s.getMetadata(ctx)
		sid := uuid.New()

		_, err = s.db.Queries.CreateSession(ctx, dbgen.CreateSessionParams{
			ID:        sid,
			UserID:    user.ID,
			IpAddress: ip,
			Device:    ua,
		})
		if err != nil {
			return nil, status.Error(codes.Internal, "session creation failed")
		}

		token, err := s.createAccessToken(user.ID.String(), sid.String(), true, false)
		if err != nil {
			return nil, status.Error(codes.Internal, "token error")
		}

		return &authpb.LoginResponse{
			UserId:       user.ID.String(),
			AccessToken:  &token,
			RefreshToken: &[]string{sid.String()}[0],
		}, nil
	}

	verID := uuid.NewString()
	targetEmail := user.Email.String
	if s.cfg.App.Env == "development" && s.cfg.App.TestEmail != "" {
		targetEmail = s.cfg.App.TestEmail
	}

	go func(vID, uID, email, name string) {
		asyncCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		if err := s.authRepo.StoreAndSendCode(asyncCtx, vID, uID, email, name); err != nil {
			fmt.Printf("ASYNC MAIL ERROR: %v\n", err)
		}
	}(verID, user.ID.String(), targetEmail, user.FirstName)

	return &authpb.LoginResponse{UserId: verID}, nil
}

func (s *Server) VerifyEmail(ctx context.Context, req *authpb.VerifyEmailRequest) (*authpb.VerifyEmailResponse, error) {
	limitCfg := s.cfg.RateLimit.Auth.Verify
	allowed, err := s.authLimiter.Allow(ctx, "limit:verify:"+req.UserId, limitCfg.Limit, limitCfg.Window)
	if err != nil {
		return nil, status.Error(codes.Internal, "limiter error")
	}
	if !allowed {
		return nil, status.Error(codes.ResourceExhausted, "too many attempts")
	}

	storedID, err := s.authRepo.VerifyCode(ctx, req.UserId, req.Code)
	if err != nil {
		return nil, status.Error(codes.PermissionDenied, err.Error())
	}

	var uid uuid.UUID
	ip, ua := s.getMetadata(ctx)
	sid := uuid.New()

	if storedID == "PENDING" {
		val, err := s.rdb.Get(ctx, "pending_reg:"+req.UserId).Result()
		if err != nil {
			return nil, status.Error(codes.DeadlineExceeded, "registration session expired")
		}

		var p pendingUser
		if err := json.Unmarshal([]byte(val), &p); err != nil {
			return nil, status.Error(codes.Internal, "internal data error")
		}

		newID := uuid.New()
		params := dbgen.CreateUserParams{
			ID:        newID,
			Email:     sql.NullString{String: p.Email, Valid: true},
			FirstName: p.FirstName,
			Password:  sql.NullString{String: p.Password, Valid: true},
			Status:    "OFFLINE",
			LastName:  database.ToNullString(&p.LastName),
			Username:  database.ToNullString(&p.Username),
		}

		if _, err := s.userRepo.CreateUser(ctx, params); err != nil {
			if strings.Contains(err.Error(), "unique constraint") || strings.Contains(err.Error(), "23505") {
				return nil, status.Error(codes.AlreadyExists, "username or email already taken")
			}
			return nil, status.Error(codes.Internal, "failed to create user")
		}
		uid = newID
		s.rdb.Del(ctx, "pending_reg:"+req.UserId)
	} else {
		parsed, err := uuid.Parse(storedID)
		if err != nil {
			return nil, status.Error(codes.Internal, "invalid identity")
		}
		uid = parsed
	}

	tx, err := s.db.Conn.BeginTx(ctx, nil)
	if err != nil {
		return nil, status.Error(codes.Internal, "tx error")
	}
	defer func() {
		_ = tx.Rollback()
	}()

	qtx := s.db.Queries.WithTx(tx)
	_, err = qtx.CreateSession(ctx, dbgen.CreateSessionParams{
		ID:        sid,
		UserID:    uid,
		IpAddress: ip,
		Device:    ua,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "session error")
	}

	token, err := s.createAccessToken(uid.String(), sid.String(), true, false)
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

	token, err := s.createAccessToken(session.UserID.String(), session.ID.String(), true, false)
	if err != nil {
		return nil, status.Error(codes.Internal, "token generation failed")
	}

	return &authpb.RefreshTokenResponse{
		AccessToken:  token,
		RefreshToken: session.ID.String(),
	}, nil
}

func (s *Server) GetUser(ctx context.Context, req *authpb.GetUserRequest) (*authpb.GetUserResponse, error) {
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id required")
	}

	uid, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid uuid")
	}

	user, err := s.userRepo.GetByID(ctx, uid)
	if err != nil {
		return nil, status.Error(codes.NotFound, "user not found")
	}

	resp := &authpb.GetUserResponse{
		Id:        user.ID.String(),
		Email:     user.Email.String,
		FirstName: user.FirstName,
		Status:    user.Status,
	}

	if user.LastName.Valid {
		resp.LastName = &user.LastName.String
	}
	if user.Username.Valid {
		resp.Username = &user.Username.String
	}

	return resp, nil
}

func (s *Server) CreateBotToken(ctx context.Context, req *authpb.CreateBotTokenRequest) (*authpb.CreateBotTokenResponse, error) {
	if req.BotId == "" {
		return nil, status.Error(codes.InvalidArgument, "bot_id is required")
	}

	token, err := s.createAccessToken(req.BotId, "", true, true)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to generate bot token")
	}

	return &authpb.CreateBotTokenResponse{
		AccessToken: token,
	}, nil
}
