package auth_svc

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"os"
	"time"

	"github.com/aerogram-org/aerogram-api/internal/config"
	authpb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/auth/v1"
	"github.com/aerogram-org/aerogram-api/internal/models"
	"github.com/aerogram-org/aerogram-api/internal/repositories"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"
)

type Server struct {
	authpb.UnimplementedAuthServiceServer
	authRepo *repositories.AuthRepository
	userRepo *repositories.UserRepository
	cfg      *config.Config
	db       *gorm.DB
}

func NewServer(db *gorm.DB, rdb *redis.Client, cfg *config.Config) *Server {
	resendKey := os.Getenv("RESEND_TOKEN")
	return &Server{
		db:       db,
		authRepo: repositories.NewAuthRepository(rdb, resendKey),
		userRepo: repositories.NewUserRepository(db),
		cfg:      cfg,
	}
}

func (s *Server) getMetadata(ctx context.Context) (string, string) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return "unknown", "unknown"
	}
	ip := "unknown"
	if v := md.Get("x-real-ip"); len(v) > 0 {
		ip = v[0]
	}
	ua := "unknown"
	if v := md.Get("x-client-device"); len(v) > 0 {
		ua = v[0]
	} else if v := md.Get("user-agent"); len(v) > 0 {
		ua = v[0]
	}
	return ip, ua
}

func (s *Server) createAccessToken(userID, sessionID string, verified bool) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", status.Error(codes.Internal, "security configuration missing")
	}
	ttl := s.cfg.JWT.TTL()
	claims := jwt.MapClaims{
		"sub":      userID,
		"sid":      sessionID,
		"verified": verified,
		"exp":      time.Now().Add(ttl).Unix(),
		"iat":      time.Now().Unix(),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString([]byte(secret))
}

func (s *Server) SignUp(ctx context.Context, req *authpb.SignUpRequest) (*authpb.SignUpResponse, error) {
	if req.Email == "" || req.FirstName == "" || req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "email, first name, and password are required")
	}

	existing, err := s.userRepo.GetByEmail(req.Email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, status.Error(codes.Internal, "failed to verify account availability")
	}
	if existing != nil {
		return nil, status.Error(codes.AlreadyExists, "an account with this email already exists")
	}

	pwHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to process security credentials")
	}

	user := &models.User{
		ID:              uuid.NewString(),
		Email:           req.Email,
		FirstName:       req.FirstName,
		Password:        string(pwHash),
		IsPremium:       false,
		IsEmailVerified: false,
		CreatedAt:       time.Now(),
	}

	if req.LastName != nil {
		user.LastName = *req.LastName
	}
	if req.Username != nil {
		user.Username = *req.Username
	}

	if err := s.db.Create(user).Error; err != nil {
		return nil, status.Error(codes.Internal, "failed to create user profile")
	}

	verificationID := uuid.NewString()
	err = s.authRepo.StoreAndSendCode(ctx, verificationID, user.ID, user.Email, user.FirstName)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to send verification code")
	}

	return &authpb.SignUpResponse{
		UserId: verificationID,
	}, nil
}

func (s *Server) Login(ctx context.Context, req *authpb.LoginRequest) (*authpb.LoginResponse, error) {
	if req.Email == "" || req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "email and password are required")
	}

	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, status.Error(codes.Unauthenticated, "invalid email or password")
	}

	if !user.IsEmailVerified {
		return nil, status.Error(codes.PermissionDenied, "please verify your email address before logging in")
	}

	verificationID := uuid.NewString()
	err = s.authRepo.StoreAndSendCode(ctx, verificationID, user.ID, user.Email, user.FirstName)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to send verification code")
	}

	return &authpb.LoginResponse{
		UserId: verificationID,
	}, nil
}

func (s *Server) VerifyEmail(ctx context.Context, req *authpb.VerifyEmailRequest) (*authpb.VerifyEmailResponse, error) {
	if req.UserId == "" || req.Code == "" {
		return nil, status.Error(codes.InvalidArgument, "verification ID and code are required")
	}

	realUserID, err := s.authRepo.VerifyCode(ctx, req.UserId, req.Code)
	if err != nil {
		switch {
		case errors.Is(err, repositories.ErrCodeExpired):
			return nil, status.Error(codes.DeadlineExceeded, "the verification code has expired")
		case errors.Is(err, repositories.ErrCodeInvalid):
			return nil, status.Error(codes.InvalidArgument, "invalid verification code")
		case errors.Is(err, repositories.ErrTooManyAttempts):
			return nil, status.Error(codes.ResourceExhausted, "too many failed attempts. please request a new code")
		default:
			return nil, status.Error(codes.Internal, "an error occurred during verification")
		}
	}

	ip, ua := s.getMetadata(ctx)
	var accessToken, rawRefresh string

	err = s.db.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.Where("id = ?", realUserID).First(&user).Error; err != nil {
			return status.Error(codes.NotFound, "user profile not found")
		}

		if !user.IsEmailVerified {
			user.IsEmailVerified = true
			if err := tx.Save(&user).Error; err != nil {
				return status.Error(codes.Internal, "failed to update user status")
			}
		}

		rawRefresh = uuid.NewString()
		sum := sha256.Sum256([]byte(rawRefresh))
		refresh := &models.RefreshToken{
			ID:       uuid.NewString(),
			UserID:   user.ID,
			Token:    hex.EncodeToString(sum[:]),
			Expiry:   time.Now().Add(s.cfg.JWT.TTL() * 24),
			IsActive: true,
		}
		if err := tx.Create(refresh).Error; err != nil {
			return status.Error(codes.Internal, "failed to provision refresh token")
		}

		session := &models.Session{
			ID:        uuid.NewString(),
			UserID:    user.ID,
			IPAddress: ip,
			Device:    ua,
			IsActive:  true,
			CreatedAt: time.Now(),
		}
		if err := tx.Create(session).Error; err != nil {
			return status.Error(codes.Internal, "failed to establish session")
		}

		var tokenErr error
		accessToken, tokenErr = s.createAccessToken(user.ID, session.ID, true)
		if tokenErr != nil {
			return tokenErr
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &authpb.VerifyEmailResponse{
		AccessToken:  accessToken,
		RefreshToken: rawRefresh,
	}, nil
}

func (s *Server) RefreshToken(ctx context.Context, req *authpb.RefreshTokenRequest) (*authpb.RefreshTokenResponse, error) {
	if req.RefreshToken == "" {
		return nil, status.Error(codes.InvalidArgument, "refresh token is required")
	}

	sum := sha256.Sum256([]byte(req.RefreshToken))
	hashedToken := hex.EncodeToString(sum[:])

	var oldToken models.RefreshToken
	if err := s.db.Where("token = ? AND is_active = ? AND expiry > ?", hashedToken, true, time.Now()).First(&oldToken).Error; err != nil {
		return nil, status.Error(codes.Unauthenticated, "session expired or invalid")
	}

	ip, ua := s.getMetadata(ctx)
	var accessToken, newRawRefresh string

	err := s.db.Transaction(func(tx *gorm.DB) error {
		oldToken.IsActive = false
		if err := tx.Save(&oldToken).Error; err != nil {
			return status.Error(codes.Internal, "failed to rotate session")
		}

		newRawRefresh = uuid.NewString()
		newSum := sha256.Sum256([]byte(newRawRefresh))
		newRefreshToken := &models.RefreshToken{
			ID:       uuid.NewString(),
			UserID:   oldToken.UserID,
			Token:    hex.EncodeToString(newSum[:]),
			Expiry:   time.Now().Add(s.cfg.JWT.TTL() * 24),
			IsActive: true,
		}
		if err := tx.Create(newRefreshToken).Error; err != nil {
			return status.Error(codes.Internal, "failed to create new session")
		}

		session := &models.Session{
			ID:        uuid.NewString(),
			UserID:    oldToken.UserID,
			IPAddress: ip,
			Device:    ua,
			IsActive:  true,
			CreatedAt: time.Now(),
		}
		if err := tx.Create(session).Error; err != nil {
			return status.Error(codes.Internal, "failed to register session")
		}

		var tokenErr error
		accessToken, tokenErr = s.createAccessToken(oldToken.UserID, session.ID, true)
		if tokenErr != nil {
			return tokenErr
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &authpb.RefreshTokenResponse{
		AccessToken:  accessToken,
		RefreshToken: newRawRefresh,
	}, nil
}
