package presence_svc

import (
	"context"

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
	err := s.repo.SetOnline(ctx, req.UserId)
	if err != nil {
		return &presencepb.SetOnlineResponse{Ok: false}, status.Error(codes.Internal, "failed to set online status")
	}
	return &presencepb.SetOnlineResponse{Ok: true}, nil
}

func (s *Server) SetOffline(ctx context.Context, req *presencepb.SetOfflineRequest) (*presencepb.SetOfflineResponse, error) {
	err := s.repo.SetOffline(ctx, req.UserId)
	if err != nil {
		return &presencepb.SetOfflineResponse{Ok: false}, status.Error(codes.Internal, "failed to set offline status")
	}
	return &presencepb.SetOfflineResponse{Ok: true}, nil
}

func (s *Server) IsOnline(ctx context.Context, req *presencepb.IsOnlineRequest) (*presencepb.IsOnlineResponse, error) {
	statusStr, err := s.repo.GetStatus(ctx, req.UserId)
	if err != nil {
		return &presencepb.IsOnlineResponse{Online: false}, status.Error(codes.Internal, "failed to retrieve status")
	}
	return &presencepb.IsOnlineResponse{Online: statusStr == "online"}, nil
}

func (s *Server) GetBulk(ctx context.Context, req *presencepb.GetBulkRequest) (*presencepb.GetBulkResponse, error) {
	res := make(map[string]bool, len(req.UserIds))
	for _, id := range req.UserIds {
		statusStr, _ := s.repo.GetStatus(ctx, id)
		res[id] = statusStr == "online"
	}
	return &presencepb.GetBulkResponse{Online: res}, nil
}
