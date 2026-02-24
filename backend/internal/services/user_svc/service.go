package user_svc

import (
	"context"
	"errors"

	errorspb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/errors/v1"
	userpb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/user/v1"
	"github.com/aerogram-org/aerogram-api/internal/models"
	"github.com/aerogram-org/aerogram-api/internal/repositories"
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
				Id:        u.ID,
				FirstName: u.FirstName,
				LastName:  &u.LastName,
				Email:     &u.Email,
				Username:  &u.Username,
			},
		},
	}, nil
}
