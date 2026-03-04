package user_svc

import (
	"context"
	"errors"

	errorspb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/errors/v1"
	userpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/user/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/models"
	"github.com/tr1xdev/aerogram-messenger/internal/repositories"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"
)

type Server struct {
	userpb.UnimplementedUserServiceServer
	userRepo *repositories.UserRepository
	db       *gorm.DB
}

func NewServer(db *gorm.DB) *Server {
	return &Server{
		db:       db,
		userRepo: repositories.NewUserRepository(db),
	}
}

func (s *Server) UserInfo(ctx context.Context, req *userpb.UserInfoRequest) (*userpb.UserInfoResponse, error) {
	var u models.User
	var err error

	switch v := req.Identifier.(type) {
	case *userpb.UserInfoRequest_Id:
		err = s.db.Where("id = ?", v.Id).First(&u).Error
	case *userpb.UserInfoRequest_Username:
		err = s.db.Where("username = ?", v.Username).First(&u).Error
	default:
		return nil, status.Error(codes.InvalidArgument, "identifier is required")
	}

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &userpb.UserInfoResponse{
				Response: &userpb.UserInfoResponse_Error{
					Error: &errorspb.CommonError{
						Code:    errorspb.ErrorCode_ERROR_CODE_NOT_FOUND.Enum(),
						Message: "user not found",
					},
				},
			}, nil
		}
		return nil, status.Error(codes.Internal, "failed to query user profile")
	}

	return &userpb.UserInfoResponse{
		Response: &userpb.UserInfoResponse_User{
			User: &userpb.User{
				Id:               u.ID,
				FirstName:        u.FirstName,
				LastName:         u.LastName,
				Email:            &u.Email,
				Username:         u.Username,
				PublicKey:        u.PublicKey,
				EncryptedPrivKey: u.EncryptedPrivKey,
				EncryptionIv:     u.EncryptionIv,
			},
		},
	}, nil
}

func (s *Server) GetUsers(ctx context.Context, req *userpb.GetUsersRequest) (*userpb.GetUsersResponse, error) {
	var users []models.User
	if err := s.db.WithContext(ctx).Where("id IN ?", req.Ids).Find(&users).Error; err != nil {
		return nil, status.Error(codes.Internal, "failed to batch fetch users")
	}

	pbUsers := make([]*userpb.User, len(users))
	for i, u := range users {
		pbUsers[i] = &userpb.User{
			Id:               u.ID,
			FirstName:        u.FirstName,
			LastName:         u.LastName,
			Email:            &u.Email,
			Username:         u.Username,
			PublicKey:        u.PublicKey,
			EncryptedPrivKey: u.EncryptedPrivKey,
			EncryptionIv:     u.EncryptionIv,
		}
	}

	return &userpb.GetUsersResponse{Users: pbUsers}, nil
}

func (s *Server) UpdateUser(ctx context.Context, req *userpb.UpdateUserRequest) (*userpb.UpdateUserResponse, error) {
	var u models.User
	if err := s.db.First(&u, "id = ?", req.Id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &userpb.UpdateUserResponse{
				Response: &userpb.UpdateUserResponse_Error{
					Error: &errorspb.CommonError{
						Code:    errorspb.ErrorCode_ERROR_CODE_NOT_FOUND.Enum(),
						Message: "user not found",
					},
				},
			}, nil
		}
		return nil, status.Error(codes.Internal, "database error")
	}

	updates := make(map[string]interface{})
	if req.FirstName != nil {
		updates["first_name"] = *req.FirstName
	}
	if req.LastName != nil {
		updates["last_name"] = req.LastName
	}
	if req.Username != nil {
		updates["username"] = req.Username
	}
	if req.PublicKey != nil {
		updates["public_key"] = req.PublicKey
	}
	if req.EncryptedPrivKey != nil {
		updates["encrypted_priv_key"] = req.EncryptedPrivKey
	}
	if req.EncryptionIv != nil {
		updates["encryption_iv"] = req.EncryptionIv
	}

	if err := s.db.Model(&u).Updates(updates).Error; err != nil {
		return nil, status.Error(codes.Internal, "failed to update user")
	}

	return &userpb.UpdateUserResponse{
		Response: &userpb.UpdateUserResponse_User{
			User: &userpb.User{
				Id:               u.ID,
				FirstName:        u.FirstName,
				LastName:         u.LastName,
				Email:            &u.Email,
				Username:         u.Username,
				PublicKey:        u.PublicKey,
				EncryptedPrivKey: u.EncryptedPrivKey,
				EncryptionIv:     u.EncryptionIv,
			},
		},
	}, nil
}
