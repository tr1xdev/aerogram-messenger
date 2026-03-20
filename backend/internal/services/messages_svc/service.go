package messages_svc

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	chatv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/chat/v1"
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
		log.Printf("[SVC_ERR] Invalid ChatId: %s", req.ChatId)
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}
	senderID, err := uuid.Parse(req.SenderId)
	if err != nil {
		log.Printf("[SVC_ERR] Invalid SenderId: %s", req.SenderId)
		return nil, status.Error(codes.InvalidArgument, "invalid sender id")
	}

	tx, err := s.db.Conn.BeginTx(ctx, nil)
	if err != nil {
		log.Printf("[ERROR] SendMessage: failed to begin tx: %v", err)
		return nil, status.Error(codes.Internal, "failed to begin transaction")
	}
	defer tx.Rollback()

	qtx := s.db.Queries.WithTx(tx)

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
		log.Printf("[ERROR] SendMessage: failed to save message: %v. Params: ChatID=%s, SenderID=%s", err, chatID, senderID)
		return nil, status.Error(codes.Internal, "failed to save message")
	}

	err = qtx.UpdateDialogLastMessage(ctx, dbgen.UpdateDialogLastMessageParams{
		ID:            chatID,
		LastMessageID: database.UUIDToNullUUID(msg.ID),
		LastMessageAt: database.TimeToNullTime(msg.CreatedAt),
	})
	if err != nil {
		log.Printf("[WARN] SendMessage: failed to update last message: %v", err)
	}

	_ = qtx.UnhideDialogForMembers(ctx, chatID)

	if err := tx.Commit(); err != nil {
		log.Printf("[ERROR] SendMessage: failed to commit tx: %v", err)
		return nil, status.Error(codes.Internal, "failed to commit transaction")
	}

	protoMsg := s.mapDBToProto(msg)

	msgPayload, _ := json.Marshal(protoMsg)
	s.rdb.Publish(ctx, "chat:"+req.ChatId, msgPayload)

	dialog, err := s.dialogRepo.GetDialogByID(ctx, req.ChatId)
	if err == nil {
		protoChat := s.mapDBDialogToProto(dialog)
		chatType := strings.ToUpper(strings.TrimPrefix(protoChat.Type.String(), "CHAT_TYPE_"))

		chatNotification := map[string]interface{}{
			"id":           protoChat.Id,
			"title":        protoChat.Title,
			"type":         chatType,
			"slug":         protoChat.Slug,
			"membersCount": protoChat.MembersCount,
			"lastMessage":  protoMsg,
		}

		chatJson, _ := json.Marshal(chatNotification)
		members, err := s.db.Queries.GetDialogMembers(ctx, chatID)
		if err == nil {
			for _, m := range members {
				s.rdb.Publish(ctx, "user_chats:"+m.UserID.String(), chatJson)
			}
		} else {
			log.Printf("[WARN] SendMessage: failed to get members for notification: %v", err)
		}
	} else {
		log.Printf("[WARN] SendMessage: failed to get dialog for notification: %v", err)
	}

	return &messagespb.SendMessageResponse{Message: protoMsg}, nil
}

func (s *Server) GetHistory(ctx context.Context, req *messagespb.GetHistoryRequest) (*messagespb.GetHistoryResponse, error) {
	cid, err := uuid.Parse(req.ChatId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}

	limit := req.Limit
	if limit <= 0 {
		limit = 50
	}

	msgs, err := s.messageRepo.GetHistory(ctx, cid, limit, req.Offset)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to fetch history")
	}

	res := make([]*messagespb.Message, len(msgs))
	for i, m := range msgs {
		res[i] = s.mapHistoryRowToProto(m)
	}

	return &messagespb.GetHistoryResponse{Messages: res}, nil
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

func (s *Server) UpdateMessage(ctx context.Context, req *messagespb.UpdateMessageRequest) (*messagespb.UpdateMessageResponse, error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid message id")
	}
	sid, err := uuid.Parse(req.SenderId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid sender id")
	}

	msg, err := s.messageRepo.UpdateExtended(ctx, dbgen.UpdateMessageExtendedParams{
		ID:           id,
		AuthorID:     sid,
		Content:      req.Text,
		EncryptionIv: database.ToNullString(req.EncryptionIv),
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update message")
	}

	return &messagespb.UpdateMessageResponse{Message: s.mapDBToProto(msg)}, nil
}

func (s *Server) DeleteMessage(ctx context.Context, req *messagespb.DeleteMessageRequest) (*messagespb.DeleteMessageResponse, error) {
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid message id")
	}
	sid, err := uuid.Parse(req.SenderId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid sender id")
	}

	if err := s.messageRepo.Delete(ctx, id, sid); err != nil {
		return nil, status.Error(codes.Internal, "failed to delete message")
	}

	return &messagespb.DeleteMessageResponse{Success: true}, nil
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
		iv := m.EncryptionIv.String
		pb.EncryptionIv = &iv
	}
	if m.ReplyToID.Valid {
		rid := m.ReplyToID.UUID.String()
		pb.ReplyToId = &rid
	}
	return pb
}

func (s *Server) mapHistoryRowToProto(m dbgen.GetChatHistoryRow) *messagespb.Message {
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
		Sender: &messagespb.User{
			Id:        m.AuthorID.String(),
			Username:  m.AuthorUsername.String,
			FirstName: m.AuthorFirstName,
			LastName:  m.AuthorLastName.String,
			PublicKey: m.AuthorPublicKey.String,
			PhotoUrl:  m.AuthorPhotoUrl.String,
		},
	}
	if m.EncryptionIv.Valid {
		iv := m.EncryptionIv.String
		pb.EncryptionIv = &iv
	}
	if m.ReplyToID.Valid {
		rid := m.ReplyToID.UUID.String()
		pb.ReplyToId = &rid
	}
	return pb
}

func (s *Server) mapDBDialogToProto(d dbgen.Dialog) *chatv1.Chat {
	res := &chatv1.Chat{
		Id:           d.ID.String(),
		MembersCount: int32(d.MembersCount),
		IsVerified:   d.IsVerified,
	}
	if d.Name.Valid {
		res.Title = d.Name.String
	}
	if d.Username.Valid {
		res.Slug = d.Username.String
	}
	if d.LastMessageID.Valid {
		res.LastMessageId = d.LastMessageID.UUID.String()
	}
	switch d.Type {
	case "group":
		res.Type = chatv1.ChatType_CHAT_TYPE_GROUP
	case "channel":
		res.Type = chatv1.ChatType_CHAT_TYPE_CHANNEL
	default:
		res.Type = chatv1.ChatType_CHAT_TYPE_PRIVATE
	}
	return res
}
