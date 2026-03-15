package presence_svc

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	presencepb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/presence/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/repositories"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Server struct {
	presencepb.UnimplementedPresenceServiceServer
	repo *repositories.PresenceRepository
}

func NewServer(repo *repositories.PresenceRepository) *Server {
	return &Server{repo: repo}
}

func (s *Server) SetOnline(ctx context.Context, req *presencepb.SetOnlineRequest) (*presencepb.SetOnlineResponse, error) {
	uid, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid user id")
	}

	if err := s.repo.SetOnline(ctx, uid, 30*time.Second); err != nil {
		return nil, status.Error(codes.Internal, "failed to set online")
	}

	return &presencepb.SetOnlineResponse{Ok: true}, nil
}

func (s *Server) SetOffline(ctx context.Context, req *presencepb.SetOfflineRequest) (*presencepb.SetOfflineResponse, error) {
	uid, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid user id")
	}

	if err := s.repo.SetOffline(ctx, uid); err != nil {
		return nil, status.Error(codes.Internal, "failed to set offline")
	}

	return &presencepb.SetOfflineResponse{Ok: true}, nil
}

func (s *Server) IsOnline(ctx context.Context, req *presencepb.IsOnlineRequest) (*presencepb.IsOnlineResponse, error) {
	uid, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid user id")
	}

	statuses, err := s.repo.GetStatuses(ctx, []uuid.UUID{uid})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get status")
	}

	val := "offline"
	if sVal, ok := statuses[uid]; ok {
		val = sVal
	}

	return &presencepb.IsOnlineResponse{Status: val}, nil
}

func (s *Server) GetBulk(ctx context.Context, req *presencepb.GetBulkRequest) (*presencepb.GetBulkResponse, error) {
	if len(req.UserIds) == 0 {
		return &presencepb.GetBulkResponse{Statuses: make(map[string]string)}, nil
	}

	uids := make([]uuid.UUID, len(req.UserIds))
	for i, idStr := range req.UserIds {
		uid, err := uuid.Parse(idStr)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid user id at index %d", i)
		}
		uids[i] = uid
	}

	statuses, err := s.repo.GetStatuses(ctx, uids)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get bulk statuses")
	}

	res := make(map[string]string, len(uids))
	for _, uid := range uids {
		val := "offline"
		if sVal, ok := statuses[uid]; ok {
			val = sVal
		}
		res[strings.ToLower(uid.String())] = val
	}

	return &presencepb.GetBulkResponse{Statuses: res}, nil
}
