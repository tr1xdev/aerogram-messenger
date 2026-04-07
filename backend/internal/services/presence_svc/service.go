package presence_svc

import (
	"context"
	"encoding/json"
	"fmt"
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

func (s *Server) parseUUID(id string) (uuid.UUID, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return uuid.Nil, status.Errorf(codes.InvalidArgument, "invalid user id: %s", id)
	}
	return uid, nil
}

func (s *Server) SubscribeTyping(req *presencepb.SubscribeTypingRequest, stream presencepb.PresenceService_SubscribeTypingServer) error {
	channel := fmt.Sprintf("typing:%s", req.ChatId)
	pubsub := s.repo.GetRedisClient().Subscribe(stream.Context(), channel)
	defer pubsub.Close()

	ch := pubsub.Channel()
	for {
		select {
		case <-stream.Context().Done():
			return nil
		case msg, ok := <-ch:
			if !ok {
				return nil
			}

			var ps repositories.PresenceStatus
			if err := json.Unmarshal([]byte(msg.Payload), &ps); err != nil {
				continue
			}

			resp, _ := json.Marshal(map[string]interface{}{
				"userId":   ps.UserID.String(),
				"isTyping": ps.IsTyping,
			})

			if err := stream.Send(&presencepb.SubscribeTypingResponse{Payload: string(resp)}); err != nil {
				return err
			}
		}
	}
}

func (s *Server) PublishTyping(ctx context.Context, userID string, chatID string, isTyping bool) error {
	uid, err := s.parseUUID(userID)
	if err != nil {
		return err
	}
	return s.repo.PublishTyping(ctx, repositories.PresenceStatus{
		UserID:   uid,
		ChatID:   chatID,
		IsTyping: isTyping,
	})
}

func (s *Server) SetOnline(ctx context.Context, req *presencepb.SetOnlineRequest) (*presencepb.SetOnlineResponse, error) {
	uid, err := s.parseUUID(req.UserId)
	if err != nil {
		return nil, err
	}
	if err := s.repo.SetOnline(ctx, uid, 30*time.Second); err != nil {
		return nil, status.Error(codes.Internal, "failed to set online")
	}

	return &presencepb.SetOnlineResponse{Ok: true}, nil
}

func (s *Server) SetOffline(ctx context.Context, req *presencepb.SetOfflineRequest) (*presencepb.SetOfflineResponse, error) {
	uid, err := s.parseUUID(req.UserId)
	if err != nil {
		return nil, err
	}

	if err := s.repo.SetOffline(ctx, uid); err != nil {
		return nil, status.Error(codes.Internal, "failed to set offline")
	}

	return &presencepb.SetOfflineResponse{Ok: true}, nil
}

func (s *Server) IsOnline(ctx context.Context, req *presencepb.IsOnlineRequest) (*presencepb.IsOnlineResponse, error) {
	uid, err := s.parseUUID(req.UserId)
	if err != nil {
		return nil, err
	}
	statusStr, err := s.repo.GetStatus(ctx, uid)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get status")
	}
	return &presencepb.IsOnlineResponse{Status: statusStr}, nil
}

func (s *Server) GetBulk(ctx context.Context, req *presencepb.GetBulkRequest) (*presencepb.GetBulkResponse, error) {
	if len(req.UserIds) == 0 {
		return &presencepb.GetBulkResponse{Statuses: make(map[string]string)}, nil
	}
	uids := make([]uuid.UUID, len(req.UserIds))
	for i, idStr := range req.UserIds {
		uid, err := s.parseUUID(idStr)
		if err != nil {
			return nil, err
		}
		uids[i] = uid
	}
	statuses, err := s.repo.GetStatuses(ctx, uids)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get bulk statuses")
	}
	res := make(map[string]string, len(uids))
	for _, uid := range uids {
		statusStr := "offline"
		if val, ok := statuses[uid]; ok {
			statusStr = val
		}
		res[strings.ToLower(uid.String())] = statusStr
	}
	return &presencepb.GetBulkResponse{Statuses: res}, nil
}
