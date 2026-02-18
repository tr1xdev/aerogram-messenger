package presence_svc

import (
	"context"

	presencepb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/presence/v1"
	"github.com/aerogram-org/aerogram-api/internal/repositories"
)

type Server struct {
	presencepb.UnimplementedPresenceServiceServer
	repo *repositories.PresenceRepository
}

func NewServer(repo *repositories.PresenceRepository) *Server {
	return &Server{repo: repo}
}

func (s *Server) SetOnline(ctx context.Context, req *presencepb.SetOnlineRequest) (*presencepb.SetOnlineResponse, error) {
	err := s.repo.SetOnline(ctx, req.UserId)
	if err != nil {
		return &presencepb.SetOnlineResponse{Ok: false}, err
	}
	return &presencepb.SetOnlineResponse{Ok: true}, nil
}

func (s *Server) SetOffline(ctx context.Context, req *presencepb.SetOfflineRequest) (*presencepb.SetOfflineResponse, error) {
	err := s.repo.SetOffline(ctx, req.UserId)
	if err != nil {
		return &presencepb.SetOfflineResponse{Ok: false}, err
	}
	return &presencepb.SetOfflineResponse{Ok: true}, nil
}

func (s *Server) IsOnline(ctx context.Context, req *presencepb.IsOnlineRequest) (*presencepb.IsOnlineResponse, error) {
	status, err := s.repo.GetStatus(ctx, req.UserId)
	if err != nil {
		return &presencepb.IsOnlineResponse{Online: false}, err
	}
	return &presencepb.IsOnlineResponse{Online: status == "online"}, nil
}

func (s *Server) GetBulk(ctx context.Context, req *presencepb.GetBulkRequest) (*presencepb.GetBulkResponse, error) {
	res := make(map[string]bool, len(req.UserIds))
	for _, id := range req.UserIds {
		status, _ := s.repo.GetStatus(ctx, id)
		res[id] = status == "online"
	}
	return &presencepb.GetBulkResponse{Online: res}, nil
}
