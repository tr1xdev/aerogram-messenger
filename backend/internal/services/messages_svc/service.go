package messages_svc

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/tr1xdev/aerogram-messenger/internal/config"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	chatv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/chat/v1"
	messagespb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/messages/v1"
	messagesv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/messages/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/infrastructure/limiter"
	"github.com/tr1xdev/aerogram-messenger/internal/infrastructure/storage"
	"github.com/tr1xdev/aerogram-messenger/internal/repositories"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/encoding/protojson"
)

const (
	PermSendMessages = 1
)

type Server struct {
	messagespb.UnimplementedMessagesServiceServer
	db          *database.DB
	rdb         *redis.Client
	messageRepo *repositories.MessageRepository
	dialogRepo  *repositories.DialogRepository
	limiter     limiter.RateLimiter
	s3          storage.Provider
	cfg         config.MessagesLimitConfig
}

func NewServer(db *database.DB, rdb *redis.Client, l limiter.RateLimiter, s3 storage.Provider, cfg config.MessagesLimitConfig) *Server {
	return &Server{
		db:          db,
		rdb:         rdb,
		messageRepo: repositories.NewMessageRepository(db),
		dialogRepo:  repositories.NewDialogRepository(db),
		limiter:     l,
		s3:          s3,
		cfg:         cfg,
	}
}

func (s *Server) getUserID(ctx context.Context, reqID string) string {
	if reqID != "" {
		return reqID
	}
	md, ok := metadata.FromIncomingContext(ctx)
	if ok {
		if ids := md.Get("user-id"); len(ids) > 0 {
			return ids[0]
		}
	}
	return ""
}

func (s *Server) checkPermission(ctx context.Context, dialogID uuid.UUID, userID uuid.UUID, bit int64) (bool, error) {
	dialog, err := s.db.Queries.GetDialogByID(ctx, dbgen.GetDialogByIDParams{
		ID:     dialogID,
		UserID: userID,
	})
	if err != nil {
		log.Printf("[CHECK-PERM] Dialog %s not found or access denied for user %s: %v", dialogID, userID, err)
		return false, status.Error(codes.NotFound, "chat not found or access denied")
	}

	if dialog.Type == "private" {
		return true, nil
	}

	member, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
		DialogID: dialogID,
		UserID:   userID,
	})
	if err != nil {
		log.Printf("[CHECK-PERM] User %s is not a member of %s: %v", userID, dialogID, err)
		return false, status.Error(codes.PermissionDenied, "not a member")
	}

	role := strings.ToLower(strings.TrimSpace(member.Role))
	if role == "owner" || role == "admin" {
		return true, nil
	}

	if dialog.Type == "channel" {
		log.Printf("[CHECK-PERM] User %s (role: %s) is not admin in channel %s", userID, role, dialogID)
		return false, status.Error(codes.PermissionDenied, "only admins can post in channels")
	}

	settings, err := s.db.Queries.GetDialogSettings(ctx, dialogID)
	if err != nil {
		return true, nil
	}

	if (settings.Permissions & bit) != 0 {
		return false, status.Error(codes.PermissionDenied, "restricted action")
	}

	return true, nil
}

func (s *Server) SendMessage(ctx context.Context, req *messagespb.SendMessageRequest) (*messagespb.SendMessageResponse, error) {
	senderIDStr := s.getUserID(ctx, req.SenderId)
	if senderIDStr == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized")
	}

	chatID, err := uuid.Parse(req.ChatId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}
	senderID, err := uuid.Parse(senderIDStr)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid sender id")
	}

	allowed, err := s.checkPermission(ctx, chatID, senderID, PermSendMessages)
	if err != nil {
		return nil, err
	}
	if !allowed {
		return nil, status.Error(codes.PermissionDenied, "no permission to send messages")
	}

	if err := s.limiter.Check(ctx, "msg:send:"+senderIDStr, s.cfg.Send.Limit, s.cfg.Send.Window); err != nil {
		return nil, status.Error(codes.ResourceExhausted, "too many messages")
	}

	dialog, err := s.dialogRepo.GetDialogByID(ctx, req.ChatId, senderID)
	if err != nil {
		return nil, status.Error(codes.NotFound, "chat details not found")
	}

	var replyToID uuid.NullUUID
	if req.ReplyToId != nil && *req.ReplyToId != "" {
		if rUUID, err := uuid.Parse(*req.ReplyToId); err == nil {
			replyToID = uuid.NullUUID{UUID: rUUID, Valid: true}
		}
	}

	tx, err := s.db.Conn.BeginTx(ctx, nil)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to begin transaction")
	}
	defer func() {
		_ = tx.Rollback()
	}()

	qtx := s.db.Queries.WithTx(tx)

	msg, err := qtx.CreateMessage(ctx, dbgen.CreateMessageParams{
		ID:            uuid.New(),
		DialogID:      chatID,
		AuthorID:      senderID,
		Content:       req.Text,
		ReplyToID:     replyToID,
		ForwardFromID: uuid.NullUUID{Valid: false},
		IsSystem:      false,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to save message")
	}

	if len(req.Attachments) > 0 {
		for _, att := range req.Attachments {
			_, err = qtx.CreateAttachment(ctx, dbgen.CreateAttachmentParams{
				ID:          uuid.New(),
				MessageID:   msg.ID,
				Type:        att.Type,
				FileName:    att.FileName,
				FileSize:    att.FileSize,
				ContentType: att.Type,
			})
			if err != nil {
				return nil, status.Error(codes.Internal, "failed to save attachment")
			}
		}
	}

	var targetReadSequence int64
	if dialog.Type == "private" {
		targetReadSequence = msg.Sequence
	} else {
		targetReadSequence = msg.Sequence - 1
	}

	err = qtx.UpdateMemberReadSequence(ctx, dbgen.UpdateMemberReadSequenceParams{
		DialogID:         chatID,
		UserID:           senderID,
		LastReadSequence: targetReadSequence,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update read sequence")
	}

	err = qtx.UpdateDialogLastMessage(ctx, dbgen.UpdateDialogLastMessageParams{
		ID:            chatID,
		LastMessageID: uuid.NullUUID{UUID: msg.ID, Valid: true},
		LastMessageAt: sql.NullTime{Time: msg.CreatedAt, Valid: true},
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update last message")
	}

	_ = qtx.UnhideDialogForMembers(ctx, chatID)

	if err := tx.Commit(); err != nil {
		return nil, status.Error(codes.Internal, "failed to commit transaction")
	}

	protoMsg := s.mapDBToProto(msg)

	attachments, err := s.messageRepo.GetAttachmentsByMessageID(ctx, msg.ID)
	if err == nil && len(attachments) > 0 {
		protoMsg.Attachments = make([]*messagespb.Attachment, 0, len(attachments))
		for _, a := range attachments {
			url := a.FileName
			if s.s3 != nil {
				if signed, err := s.s3.GetPresignedURL(ctx, a.FileName, time.Hour*24); err == nil {
					url = signed
				}
			}
			protoMsg.Attachments = append(protoMsg.Attachments, &messagespb.Attachment{
				Id:       a.ID.String(),
				Type:     a.Type,
				Url:      url,
				FileName: a.FileName,
				FileSize: a.FileSize,
			})
		}
	}

	marshaller := protojson.MarshalOptions{UseProtoNames: true, EmitUnpopulated: true}
	msgPayload, err := marshaller.Marshal(protoMsg)
	if err == nil {
		s.rdb.Publish(context.Background(), "chat:"+req.ChatId, msgPayload)
	}

	readPayload := map[string]interface{}{"chatId": req.ChatId, "userId": senderIDStr, "lastSequence": targetReadSequence}
	readData, _ := json.Marshal(readPayload)
	s.rdb.Publish(context.Background(), "chat:"+req.ChatId+":read", readData)

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
			s.rdb.Publish(context.Background(), "user_chats:"+m.UserID.String(), chatJson)
		}
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
	var beforeSeq int64
	if req.BeforeSequence != nil {
		beforeSeq = *req.BeforeSequence
	}
	msgs, err := s.messageRepo.GetHistory(ctx, cid, limit, int32(beforeSeq))
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
	userIDStr := s.getUserID(ctx, req.UserId)
	if userIDStr == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized")
	}
	chatID, err := uuid.Parse(req.ChatId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}
	userID, err := uuid.Parse(userIDStr)
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

	readPayload := map[string]any{"chatId": req.ChatId, "userId": userIDStr, "lastSequence": msg.Sequence}
	readData, err := json.Marshal(readPayload)
	if err == nil {
		s.rdb.Publish(context.Background(), "chat:"+req.ChatId+":read", readData)
	}

	return &messagespb.MarkAsReadResponse{Success: true}, nil
}

func (s *Server) UpdateMessage(ctx context.Context, req *messagespb.UpdateMessageRequest) (*messagespb.UpdateMessageResponse, error) {
	senderIDStr := s.getUserID(ctx, req.SenderId)
	if senderIDStr == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized")
	}
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid message id")
	}
	sid, err := uuid.Parse(senderIDStr)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid sender id")
	}
	msg, err := s.messageRepo.UpdateExtended(ctx, id, sid, req.Text)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update message")
	}
	protoMsg := s.mapDBToProto(msg)
	msgPayload, _ := protojson.Marshal(protoMsg)
	s.rdb.Publish(context.Background(), "chat:"+msg.DialogID.String()+":updated", msgPayload)
	return &messagespb.UpdateMessageResponse{Message: protoMsg}, nil
}

func (s *Server) DeleteMessage(ctx context.Context, req *messagespb.DeleteMessageRequest) (*messagespb.DeleteMessageResponse, error) {
	senderIDStr := s.getUserID(ctx, req.SenderId)
	if senderIDStr == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized")
	}
	id, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid message id")
	}
	sid, err := uuid.Parse(senderIDStr)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid sender id")
	}
	msg, err := s.messageRepo.GetByID(ctx, id)
	if err == nil {
		if err := s.messageRepo.Delete(ctx, id, sid); err != nil {
			return nil, status.Error(codes.Internal, "failed to delete message")
		}
		s.rdb.Publish(context.Background(), "chat:"+msg.DialogID.String()+":deleted", id.String())
	}
	return &messagespb.DeleteMessageResponse{Success: true}, nil
}

func (s *Server) mapDBToProto(m dbgen.Message) *messagespb.Message {
	pb := &messagespb.Message{
		Id:       m.ID.String(),
		ChatId:   m.DialogID.String(),
		SenderId: m.AuthorID.String(),
		Text:     m.Content,
		SentAt:   m.CreatedAt.Format(time.RFC3339),
		Sequence: m.Sequence,
		IsEdited: m.IsEdited,
		IsSystem: m.IsSystem,
		Sender:   &messagespb.User{Id: m.AuthorID.String()},
	}
	if m.ReplyToID.Valid {
		rid := m.ReplyToID.UUID.String()
		pb.ReplyToId = &rid
	}
	return pb
}

func (s *Server) mapHistoryRowToProto(row dbgen.GetChatHistoryRow) *messagespb.Message {
	msg := &messagespb.Message{
		Id:       row.ID.String(),
		ChatId:   row.DialogID.String(),
		SenderId: row.AuthorID.String(),
		Text:     row.Content,
		SentAt:   row.CreatedAt.Format(time.RFC3339),
		Sequence: row.Sequence,
		IsEdited: row.IsEdited,
	}

	if row.ReplyToID.Valid {
		replyID := row.ReplyToID.UUID.String()
		msg.ReplyToId = &replyID
	}

	attachments, err := s.messageRepo.GetAttachmentsByMessageID(context.Background(), row.ID)
	if err == nil && len(attachments) > 0 {
		msg.Attachments = make([]*messagesv1.Attachment, 0, len(attachments))
		for _, a := range attachments {
			url := a.FileName
			if s.s3 != nil {
				if signed, err := s.s3.GetPresignedURL(context.Background(), a.FileName, time.Hour*24); err == nil {
					url = signed
				}
			}

			msg.Attachments = append(msg.Attachments, &messagesv1.Attachment{
				Id:       a.ID.String(),
				Type:     a.Type,
				Url:      url,
				FileName: a.FileName,
				FileSize: a.FileSize,
			})
		}
	}

	return msg
}

func (s *Server) mapDBDialogToProto(d dbgen.Dialog) *chatv1.Chat {
	res := &chatv1.Chat{Id: d.ID.String(), MembersCount: int32(d.MembersCount), IsVerified: d.IsVerified}
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
