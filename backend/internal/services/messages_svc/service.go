package messages_svc

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	messagespb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/messages/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/repositories"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Server struct {
	messagespb.UnimplementedMessagesServiceServer
	db          *database.DB
	rdb         *redis.Client
	messageRepo *repositories.MessageRepository
	dialogRepo  *repositories.DialogRepository
}

func NewServer(db *database.DB, rdb *redis.Client) *Server {
	return &Server{
		db:          db,
		rdb:         rdb,
		messageRepo: repositories.NewMessageRepository(db),
		dialogRepo:  repositories.NewDialogRepository(db),
	}
}

func (s *Server) SendMessage(ctx context.Context, req *messagespb.SendMessageRequest) (*messagespb.SendMessageResponse, error) {
	chatID, err := uuid.Parse(req.ChatId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}
	senderID, err := uuid.Parse(req.SenderId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid sender id")
	}

	_, err = s.dialogRepo.GetMember(ctx, req.ChatId, req.SenderId)
	if err != nil {
		return nil, status.Error(codes.PermissionDenied, "forbidden")
	}

	msg, err := s.messageRepo.Create(ctx, dbgen.CreateMessageParams{
		ID:           uuid.New(),
		DialogID:     chatID,
		AuthorID:     senderID,
		Content:      req.Text,
		IsEncrypted:  req.IsEncrypted,
		EncryptionIv: database.ToNullString(req.EncryptionIv),
		ReplyToID:    database.ToNullUUIDPtr(req.ReplyToId),
		CreatedAt:    time.Now(),
	})
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	pb := s.mapDBToProto(msg)
	data, _ := json.Marshal(pb)
	s.rdb.Publish(ctx, "chat:"+req.ChatId, data)

	return &messagespb.SendMessageResponse{Message: pb}, nil
}

func (s *Server) GetHistory(ctx context.Context, req *messagespb.GetHistoryRequest) (*messagespb.GetHistoryResponse, error) {
	chatID, err := uuid.Parse(req.ChatId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}
	msgs, err := s.messageRepo.GetHistory(ctx, chatID, req.Limit, req.Offset)
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	res := make([]*messagespb.Message, 0, len(msgs))
	for _, m := range msgs {
		res = append(res, s.mapDBToProto(m))
	}

	return &messagespb.GetHistoryResponse{Messages: res}, nil
}

func (s *Server) UpdateMessage(ctx context.Context, req *messagespb.UpdateMessageRequest) (*messagespb.UpdateMessageResponse, error) {
	id, _ := uuid.Parse(req.Id)
	senderID, _ := uuid.Parse(req.SenderId)

	msg, err := s.messageRepo.Update(ctx, id, senderID, req.Text)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update")
	}

	return &messagespb.UpdateMessageResponse{Message: s.mapDBToProto(msg)}, nil
}

func (s *Server) DeleteMessage(ctx context.Context, req *messagespb.DeleteMessageRequest) (*messagespb.DeleteMessageResponse, error) {
	id, _ := uuid.Parse(req.Id)
	senderID, _ := uuid.Parse(req.SenderId)

	if err := s.messageRepo.Delete(ctx, id, senderID); err != nil {
		return nil, status.Error(codes.Internal, "failed to delete")
	}

	return &messagespb.DeleteMessageResponse{Success: true}, nil
}

func (s *Server) MarkAsRead(ctx context.Context, req *messagespb.MarkAsReadRequest) (*messagespb.MarkAsReadResponse, error) {
	chatID, _ := uuid.Parse(req.ChatId)
	userID, _ := uuid.Parse(req.UserId)
	msgID, _ := uuid.Parse(req.LastMessageId)

	msg, err := s.messageRepo.GetByID(ctx, msgID)
	if err != nil {
		return nil, status.Error(codes.NotFound, "message not found")
	}

	if err := s.messageRepo.MarkRead(ctx, chatID, userID, msg.Sequence); err != nil {
		return nil, status.Error(codes.Internal, "failed to mark read")
	}

	return &messagespb.MarkAsReadResponse{Success: true}, nil
}

func (s *Server) mapDBToProto(m dbgen.Message) *messagespb.Message {
	pb := &messagespb.Message{
		Id:          m.ID.String(),
		ChatId:      m.DialogID.String(),
		SenderId:    m.AuthorID.String(),
		Text:        m.Content,
		SentAt:      m.CreatedAt.Format(time.RFC3339),
		Sequence:    m.Sequence,
		IsEdited:    m.IsEdited,
		IsEncrypted: m.IsEncrypted,
		IsSystem:    m.IsSystem,
	}
	if m.EncryptionIv.Valid {
		pb.EncryptionIv = &m.EncryptionIv.String
	}
	if m.ReplyToID.Valid {
		id := m.ReplyToID.UUID.String()
		pb.ReplyToId = &id
	}
	return pb
}
