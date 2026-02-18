package user_svc

import (
	"context"

	errorspb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/errors/v1"
	userpb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/user/v1"
	"github.com/aerogram-org/aerogram-api/internal/models"
	"github.com/aerogram-org/aerogram-api/internal/repositories"
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
		return &userpb.UserInfoResponse{
			Response: &userpb.UserInfoResponse_Error{
				Error: &errorspb.CommonError{
					Message: "identifier is required",
				},
			},
		}, nil
	}

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return &userpb.UserInfoResponse{
				Response: &userpb.UserInfoResponse_Error{
					Error: &errorspb.CommonError{
						Code:    errorspb.ErrorCode_ERROR_CODE_NOT_FOUND.Enum(),
						Message: "user not found",
					},
				},
			}, nil
		}
		return nil, err
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
