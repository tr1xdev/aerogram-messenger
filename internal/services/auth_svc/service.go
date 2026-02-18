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
	"github.com/redis/go-redis/v9"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc/metadata"
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
		return "", errors.New("jwt secret not set")
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
		return nil, errors.New("email, first_name and password required")
	}

	existing, err := s.userRepo.GetByEmail(req.Email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("user already exists")
	}

	pwHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
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
		return nil, err
	}

	verificationID := uuid.NewString()
	err = s.authRepo.StoreAndSendCode(ctx, verificationID, user.ID, user.Email, user.FirstName)
	if err != nil {
		return nil, err
	}

	return &authpb.SignUpResponse{
		UserId: verificationID,
	}, nil
}

func (s *Server) Login(ctx context.Context, req *authpb.LoginRequest) (*authpb.LoginResponse, error) {
	if req.Email == "" || req.Password == "" {
		return nil, errors.New("invalid input")
	}

	user, err := s.userRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	if !user.IsEmailVerified {
		return nil, errors.New("email not verified")
	}

	verificationID := uuid.NewString()
	err = s.authRepo.StoreAndSendCode(ctx, verificationID, user.ID, user.Email, user.FirstName)
	if err != nil {
		return nil, err
	}

	return &authpb.LoginResponse{
		UserId: verificationID,
	}, nil
}

func (s *Server) VerifyEmail(ctx context.Context, req *authpb.VerifyEmailRequest) (*authpb.VerifyEmailResponse, error) {
	if req.UserId == "" || req.Code == "" {
		return nil, errors.New("invalid input")
	}

	realUserID, err := s.authRepo.VerifyCode(ctx, req.UserId, req.Code)
	if err != nil {
		return nil, err
	}

	ip, ua := s.getMetadata(ctx)
	tx := s.db.Begin()

	var user models.User
	if err := tx.Where("id = ?", realUserID).First(&user).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	if !user.IsEmailVerified {
		user.IsEmailVerified = true
		tx.Save(&user)
	}

	rawRefresh := uuid.NewString()
	sum := sha256.Sum256([]byte(rawRefresh))
	refresh := &models.RefreshToken{
		ID:       uuid.NewString(),
		UserID:   user.ID,
		Token:    hex.EncodeToString(sum[:]),
		Expiry:   time.Now().Add(s.cfg.JWT.TTL() * 24),
		IsActive: true,
	}
	tx.Create(refresh)

	session := &models.Session{
		ID:        uuid.NewString(),
		UserID:    user.ID,
		IPAddress: ip,
		Device:    ua,
		IsActive:  true,
		CreatedAt: time.Now(),
	}
	tx.Create(session)

	accessToken, _ := s.createAccessToken(user.ID, session.ID, true)
	tx.Commit()

	return &authpb.VerifyEmailResponse{
		AccessToken:  accessToken,
		RefreshToken: rawRefresh,
	}, nil
}

func (s *Server) RefreshToken(ctx context.Context, req *authpb.RefreshTokenRequest) (*authpb.RefreshTokenResponse, error) {
	if req.RefreshToken == "" {
		return nil, errors.New("refresh token required")
	}

	sum := sha256.Sum256([]byte(req.RefreshToken))
	hashedToken := hex.EncodeToString(sum[:])

	var oldToken models.RefreshToken
	if err := s.db.Where("token = ? AND is_active = ? AND expiry > ?", hashedToken, true, time.Now()).First(&oldToken).Error; err != nil {
		return nil, errors.New("invalid or expired refresh token")
	}

	ip, ua := s.getMetadata(ctx)
	tx := s.db.Begin()

	oldToken.IsActive = false
	if err := tx.Save(&oldToken).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	newRawRefresh := uuid.NewString()
	newSum := sha256.Sum256([]byte(newRawRefresh))
	newRefreshToken := &models.RefreshToken{
		ID:       uuid.NewString(),
		UserID:   oldToken.UserID,
		Token:    hex.EncodeToString(newSum[:]),
		Expiry:   time.Now().Add(s.cfg.JWT.TTL() * 24),
		IsActive: true,
	}
	if err := tx.Create(newRefreshToken).Error; err != nil {
		tx.Rollback()
		return nil, err
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
		tx.Rollback()
		return nil, err
	}

	accessToken, err := s.createAccessToken(oldToken.UserID, session.ID, true)
	if err != nil {
		tx.Rollback()
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return &authpb.RefreshTokenResponse{
		AccessToken:  accessToken,
		RefreshToken: newRawRefresh,
	}, nil
}
