package messages_svc

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	messagespb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/messages/v1"
	"github.com/aerogram-org/aerogram-api/internal/models"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type Server struct {
	messagespb.UnimplementedMessagesServiceServer
	db  *gorm.DB
	rdb *redis.Client
}

func NewServer(db *gorm.DB, rdb *redis.Client) *Server {
	return &Server{db: db, rdb: rdb}
}

func (s *Server) SendMessage(ctx context.Context, req *messagespb.SendMessageRequest) (*messagespb.SendMessageResponse, error) {
	var count int64
	s.db.Model(&models.DialogMember{}).
		Where("dialog_id = ? AND user_id = ?", req.ChatId, req.SenderId).
		Count(&count)

	if count == 0 {
		return nil, errors.New("forbidden")
	}

	msg := &models.Message{
		ID:        uuid.NewString(),
		DialogID:  req.ChatId,
		AuthorID:  req.SenderId,
		Content:   req.Text,
		ReplyToID: req.ReplyToId,
		CreatedAt: time.Now(),
	}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(msg).Error; err != nil {
			return err
		}

		return tx.Model(&models.Dialog{}).
			Where("id = ?", req.ChatId).
			Updates(map[string]interface{}{
				"last_message_id": msg.ID,
				"last_message_at": msg.CreatedAt,
			}).Error
	})

	if err != nil {
		return nil, err
	}

	pb := mapModelToProto(msg)

	data, _ := json.Marshal(pb)
	s.rdb.Publish(ctx, "chat:"+req.ChatId, data)

	return &messagespb.SendMessageResponse{Message: pb}, nil
}

func (s *Server) GetHistory(ctx context.Context, req *messagespb.GetHistoryRequest) (*messagespb.GetHistoryResponse, error) {
	var msgs []models.Message

	err := s.db.
		Where("dialog_id = ? AND is_deleted = false", req.ChatId).
		Order("created_at DESC").
		Limit(int(req.Limit)).
		Offset(int(req.Offset)).
		Find(&msgs).Error

	if err != nil {
		return nil, err
	}

	res := make([]*messagespb.Message, 0, len(msgs))
	for i := range msgs {
		res = append(res, mapModelToProto(&msgs[i]))
	}

	return &messagespb.GetHistoryResponse{Messages: res}, nil
}

func (s *Server) UpdateMessage(ctx context.Context, req *messagespb.UpdateMessageRequest) (*messagespb.UpdateMessageResponse, error) {
	var msg models.Message

	if err := s.db.First(&msg, "id = ?", req.Id).Error; err != nil {
		return nil, err
	}

	if msg.AuthorID != req.SenderId {
		return nil, errors.New("forbidden")
	}

	if err := s.db.Model(&msg).
		Updates(map[string]interface{}{
			"content":   req.Text,
			"is_edited": true,
		}).Error; err != nil {
		return nil, err
	}

	return &messagespb.UpdateMessageResponse{
		Message: mapModelToProto(&msg),
	}, nil
}

func (s *Server) DeleteMessage(ctx context.Context, req *messagespb.DeleteMessageRequest) (*messagespb.DeleteMessageResponse, error) {
	err := s.db.Model(&models.Message{}).
		Where("id = ? AND author_id = ?", req.Id, req.SenderId).
		Update("is_deleted", true).Error

	if err != nil {
		return nil, err
	}

	return &messagespb.DeleteMessageResponse{Success: true}, nil
}

func (s *Server) MarkAsRead(ctx context.Context, req *messagespb.MarkAsReadRequest) (*messagespb.MarkAsReadResponse, error) {
	err := s.db.Model(&models.DialogMember{}).
		Where("dialog_id = ? AND user_id = ?", req.ChatId, req.UserId).
		Update("last_read_at", time.Now()).Error

	if err != nil {
		return nil, err
	}

	return &messagespb.MarkAsReadResponse{Success: true}, nil
}

func mapModelToProto(m *models.Message) *messagespb.Message {
	return &messagespb.Message{
		Id:        m.ID,
		ChatId:    m.DialogID,
		SenderId:  m.AuthorID,
		Text:      m.Content,
		SentAt:    m.CreatedAt.Format(time.RFC3339),
		IsEdited:  m.IsEdited,
		ReplyToId: m.ReplyToID,
	}
}
