package user_svc

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	errorspb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/errors/v1"
	userpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/user/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/repositories"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type Server struct {
	userpb.UnimplementedUserServiceServer
	userRepo *repositories.UserRepository
	db       *database.DB
}

func NewServer(db *database.DB) *Server {
	return &Server{
		db:       db,
		userRepo: repositories.NewUserRepository(db),
	}
}

func (s *Server) UserInfo(ctx context.Context, req *userpb.UserInfoRequest) (*userpb.UserInfoResponse, error) {
	var u dbgen.User
	var err error

	switch v := req.Identifier.(type) {
	case *userpb.UserInfoRequest_Id:
		uid, parseErr := uuid.Parse(v.Id)
		if parseErr != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid uuid")
		}
		u, err = s.userRepo.GetByID(ctx, uid)
	case *userpb.UserInfoRequest_Username:
		u, err = s.userRepo.GetByUsername(ctx, v.Username)
	default:
		return nil, status.Error(codes.InvalidArgument, "identifier required")
	}

	if err != nil {
		if err == sql.ErrNoRows {
			return &userpb.UserInfoResponse{
				Response: &userpb.UserInfoResponse_Error{
					Error: &errorspb.CommonError{
						Code:    errorspb.ErrorCode_ERROR_CODE_NOT_FOUND.Enum(),
						Message: "user not found",
					},
				},
			}, nil
		}
		return nil, status.Error(codes.Internal, "db error")
	}

	return &userpb.UserInfoResponse{
		Response: &userpb.UserInfoResponse_User{
			User: s.mapDBToProto(u),
		},
	}, nil
}

func (s *Server) GetUsers(ctx context.Context, req *userpb.GetUsersRequest) (*userpb.GetUsersResponse, error) {
	uids := make([]uuid.UUID, 0, len(req.Ids))
	for _, id := range req.Ids {
		if uid, err := uuid.Parse(id); err == nil {
			uids = append(uids, uid)
		}
	}

	users, err := s.userRepo.GetByIDs(ctx, uids)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to fetch users from database")
	}

	pbUsers := make([]*userpb.User, len(users))
	for i, u := range users {
		pbUsers[i] = s.mapDBToProto(u)
	}

	return &userpb.GetUsersResponse{Users: pbUsers}, nil
}

func (s *Server) SearchUsers(ctx context.Context, req *userpb.SearchUsersRequest) (*userpb.SearchUsersResponse, error) {
	var users []dbgen.User
	var err error

	if req.Global {
		users, err = s.userRepo.GlobalSearch(ctx, req.Query)
	} else {
		users, err = s.userRepo.SearchByUsername(ctx, req.Query)
	}

	if err != nil {
		return nil, status.Error(codes.Internal, "search failed")
	}

	pbUsers := make([]*userpb.User, len(users))
	for i, u := range users {
		pbUsers[i] = s.mapDBToProto(u)
	}

	return &userpb.SearchUsersResponse{Users: pbUsers}, nil
}

func (s *Server) UpdateUser(ctx context.Context, req *userpb.UpdateUserRequest) (*userpb.UpdateUserResponse, error) {
	uid, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid user id")
	}

	params := dbgen.UpdateUserParams{
		ID:               uid,
		FirstName:        database.ToNullString(req.FirstName),
		LastName:         database.ToNullString(req.LastName),
		Username:         database.ToNullString(req.Username),
		PublicKey:        database.ToNullString(req.PublicKey),
		EncryptedPrivKey: database.ToNullString(req.EncryptedPrivKey),
		EncryptionIv:     database.ToNullString(req.EncryptionIv),
		PhotoUrl:         database.ToNullString(req.PhotoUrl),
	}

	updatedUser, err := s.userRepo.Update(ctx, params)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update user")
	}

	return &userpb.UpdateUserResponse{
		Response: &userpb.UpdateUserResponse_User{
			User: s.mapDBToProto(updatedUser),
		},
	}, nil
}

func (s *Server) mapDBToProto(u dbgen.User) *userpb.User {
	res := &userpb.User{
		Id:        u.ID.String(),
		FirstName: u.FirstName,
		Email:     &u.Email,
		CreatedAt: timestamppb.New(u.CreatedAt),
	}

	if u.Username.Valid {
		res.Username = &u.Username.String
	}
	if u.LastName.Valid {
		res.LastName = &u.LastName.String
	}
	if u.PublicKey.Valid {
		res.PublicKey = &u.PublicKey.String
	}
	if u.EncryptedPrivKey.Valid {
		res.EncryptedPrivKey = &u.EncryptedPrivKey.String
	}
	if u.EncryptionIv.Valid {
		res.EncryptionIv = &u.EncryptionIv.String
	}
	if u.PhotoUrl.Valid {
		res.PhotoUrl = &u.PhotoUrl.String
	}

	return res
}
