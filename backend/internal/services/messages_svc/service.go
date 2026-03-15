package messages_svc

import (
	"context"
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

	tx, err := s.db.Conn.BeginTx(ctx, nil)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to start transaction")
	}
	defer tx.Rollback()

	qtx := s.db.Queries.WithTx(tx)

	if err := qtx.UnhideDialogForMembers(ctx, chatID); err != nil {
		return nil, status.Error(codes.Internal, "failed to restore dialog visibility")
	}

	msg, err := qtx.CreateMessage(ctx, dbgen.CreateMessageParams{
		ID:           uuid.New(),
		DialogID:     chatID,
		AuthorID:     senderID,
		Content:      req.Text,
		IsEncrypted:  req.IsEncrypted,
		EncryptionIv: database.ToNullString(req.EncryptionIv),
		ReplyToID:    database.ToNullUUIDPtr(req.ReplyToId),
		IsSystem:     false,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to save message")
	}

	err = qtx.UpdateDialogLastMessage(ctx, dbgen.UpdateDialogLastMessageParams{
		ID:            chatID,
		LastMessageID: database.UUIDToNullUUID(msg.ID),
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update dialog")
	}

	if err := tx.Commit(); err != nil {
		return nil, status.Error(codes.Internal, "failed to commit transaction")
	}

	return &messagespb.SendMessageResponse{Message: s.mapDBToProto(msg)}, nil
}

func (s *Server) GetHistory(ctx context.Context, req *messagespb.GetHistoryRequest) (*messagespb.GetHistoryResponse, error) {
	chatID, err := uuid.Parse(req.ChatId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}

	limit := req.Limit
	if limit <= 0 {
		limit = 50
	}

	msgs, err := s.messageRepo.GetHistory(ctx, chatID, limit, req.Offset)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to fetch history")
	}

	res := make([]*messagespb.Message, 0, len(msgs))
	for _, m := range msgs {
		res = append(res, s.mapDBToProto(m))
	}
	return &messagespb.GetHistoryResponse{Messages: res}, nil
}

func (s *Server) UpdateMessage(ctx context.Context, req *messagespb.UpdateMessageRequest) (*messagespb.UpdateMessageResponse, error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid message id")
	}
	senderID, err := uuid.Parse(req.SenderId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid sender id")
	}

	msg, err := s.messageRepo.Update(ctx, id, senderID, req.Text)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update (check if you are the author)")
	}
	return &messagespb.UpdateMessageResponse{Message: s.mapDBToProto(msg)}, nil
}

func (s *Server) DeleteMessage(ctx context.Context, req *messagespb.DeleteMessageRequest) (*messagespb.DeleteMessageResponse, error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid message id")
	}
	senderID, err := uuid.Parse(req.SenderId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid sender id")
	}

	if err := s.messageRepo.Delete(ctx, id, senderID); err != nil {
		return nil, status.Error(codes.Internal, "failed to delete")
	}
	return &messagespb.DeleteMessageResponse{Success: true}, nil
}

func (s *Server) MarkAsRead(ctx context.Context, req *messagespb.MarkAsReadRequest) (*messagespb.MarkAsReadResponse, error) {
	chatID, err := uuid.Parse(req.ChatId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}
	userID, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid user id")
	}
	msgID, err := uuid.Parse(req.LastMessageId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid message id")
	}

	msg, err := s.messageRepo.GetByID(ctx, msgID)
	if err != nil {
		return nil, status.Error(codes.NotFound, "message not found")
	}

	err = s.db.Queries.UpdateMemberReadSequence(ctx, dbgen.UpdateMemberReadSequenceParams{
		DialogID:         chatID,
		UserID:           userID,
		LastReadSequence: msg.Sequence,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update read sequence")
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
