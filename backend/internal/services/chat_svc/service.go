package chat_svc

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	chatpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/chat/v1"
	messagespb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/messages/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/repositories"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type Server struct {
	chatpb.UnimplementedChatServiceServer
	db         *database.DB
	rdb        *redis.Client
	dialogRepo *repositories.DialogRepository
}

func NewServer(db *database.DB, rdb *redis.Client) *Server {
	return &Server{
		db:         db,
		rdb:        rdb,
		dialogRepo: repositories.NewDialogRepository(db),
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

func (s *Server) PinChat(ctx context.Context, req *chatpb.PinChatRequest) (*chatpb.PinChatResponse, error) {
	userID := s.getUserID(ctx, req.UserId)
	if userID == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized access")
	}

	uUUID, _ := uuid.Parse(userID)
	cUUID, _ := uuid.Parse(req.ChatId)

	err := s.db.Queries.UpdateMemberPinStatus(ctx, dbgen.UpdateMemberPinStatusParams{
		IsPinned: req.Pinned,
		DialogID: cUUID,
		UserID:   uUUID,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to pin chat")
	}

	return &chatpb.PinChatResponse{Success: true}, nil
}

func (s *Server) DeleteChat(ctx context.Context, req *chatpb.DeleteChatRequest) (*chatpb.DeleteChatResponse, error) {
	userID := s.getUserID(ctx, req.UserId)
	if userID == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized access")
	}

	uid, _ := uuid.Parse(userID)
	did, _ := uuid.Parse(req.ChatId)

	dialog, err := s.dialogRepo.GetDialogByID(ctx, req.ChatId)
	if err != nil {
		return nil, status.Error(codes.NotFound, "chat not found")
	}

	if req.ForEveryone {
		isOwner := dialog.CreatorID.Valid && dialog.CreatorID.UUID == uid
		isPrivate := dialog.Type == "private"

		if isPrivate || isOwner {
			err = s.db.Queries.DeleteDialog(ctx, did)
			if err == nil {
				s.rdb.Publish(ctx, "user_chats_deleted:"+req.ChatId, req.ChatId)
			}
		} else {
			return nil, status.Error(codes.PermissionDenied, "only owner can delete for everyone")
		}
	} else {
		err = s.db.Queries.HideDialogMember(ctx, dbgen.HideDialogMemberParams{
			DialogID: did,
			UserID:   uid,
		})
		if err == nil {
			s.rdb.Publish(ctx, "user_chats_deleted:"+userID, req.ChatId)
		}
	}

	if err != nil {
		return nil, status.Error(codes.Internal, "failed to delete chat")
	}

	return &chatpb.DeleteChatResponse{Success: true}, nil
}

func (s *Server) CreateChat(ctx context.Context, req *chatpb.CreateChatRequest) (*chatpb.CreateChatResponse, error) {
	creatorIDStr := s.getUserID(ctx, req.CreatorId)
	if creatorIDStr == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized")
	}

	if req.Type == chatpb.ChatType_CHAT_TYPE_PRIVATE {
		existingDialog, err := s.dialogRepo.GetPrivateDialogByMembers(ctx, req.ParticipantIds[0], req.ParticipantIds[1])
		if err == nil {
			return &chatpb.CreateChatResponse{Chat: s.mapDBDialogToProto(existingDialog)}, nil
		}
	}

	newID := uuid.New()
	creatorUUID, _ := uuid.Parse(creatorIDStr)

	dParams := dbgen.CreateDialogParams{
		ID:           newID,
		Type:         s.mapProtoTypeToDB(req.Type),
		Name:         database.ToNullString(req.Title),
		Username:     database.ToNullString(req.Slug),
		CreatorID:    uuid.NullUUID{UUID: creatorUUID, Valid: true},
		MembersCount: int32(len(req.ParticipantIds)),
		IsActive:     true,
	}

	mParams := make([]dbgen.AddDialogMemberParams, len(req.ParticipantIds))
	for i, pID := range req.ParticipantIds {
		pUUID, _ := uuid.Parse(pID)
		role := "member"
		if pID == creatorIDStr {
			role = "owner"
		}
		mParams[i] = dbgen.AddDialogMemberParams{
			DialogID: newID,
			UserID:   pUUID,
			Role:     role,
		}
	}

	sParams := dbgen.CreateDialogSettingsParams{DialogID: newID}

	if err := s.dialogRepo.CreateDialog(ctx, dParams, mParams, sParams); err != nil {
		return nil, status.Error(codes.Internal, "database error")
	}

	dialog, _ := s.dialogRepo.GetDialogByID(ctx, newID.String())
	protoChat := s.mapDBDialogToProto(dialog)

	chatType := strings.ToUpper(strings.TrimPrefix(req.Type.String(), "CHAT_TYPE_"))
	displayTitle := protoChat.Title
	if displayTitle == "" && req.Type == chatpb.ChatType_CHAT_TYPE_PRIVATE {
		displayTitle = "New Chat"
	}

	notification := map[string]interface{}{
		"id":           protoChat.Id,
		"title":        displayTitle,
		"type":         chatType,
		"slug":         protoChat.Slug,
		"membersCount": protoChat.MembersCount,
		"isVerified":   protoChat.IsVerified,
		"createdAt":    time.Now().Format(time.RFC3339),
		"unreadCount":  0,
	}

	payload, _ := json.Marshal(notification)
	for _, pID := range req.ParticipantIds {
		s.rdb.Publish(ctx, "user_chats:"+pID, payload)
	}

	return &chatpb.CreateChatResponse{Chat: protoChat}, nil
}

func (s *Server) GetMyChats(ctx context.Context, req *chatpb.GetMyChatsRequest) (*chatpb.GetMyChatsResponse, error) {
	userID := s.getUserID(ctx, req.UserId)
	if userID == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized access")
	}

	dialogs, err := s.dialogRepo.GetUserDialogs(ctx, userID)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to retrieve conversation list")
	}

	res := make([]*chatpb.Chat, 0, len(dialogs))
	for _, d := range dialogs {
		res = append(res, s.mapGetUserDialogsRowToProto(d))
	}

	return &chatpb.GetMyChatsResponse{Chats: res}, nil
}

func (s *Server) GetChat(ctx context.Context, req *chatpb.GetChatRequest) (*chatpb.GetChatResponse, error) {
	var dialog dbgen.Dialog
	var err error

	userID := s.getUserID(ctx, req.UserId)

	if req.ChatId != nil && *req.ChatId != "" {
		dialog, err = s.dialogRepo.GetDialogByID(ctx, *req.ChatId)
	} else if req.Slug != nil && *req.Slug != "" {
		slug, _ := strings.CutPrefix(*req.Slug, "@")
		dialog, err = s.dialogRepo.GetDialogByUsername(ctx, slug)

		if err != nil && userID != "" {
			userRepo := repositories.NewUserRepository(s.db)
			targetUser, userErr := userRepo.GetByUsername(ctx, slug)

			if userErr == nil {
				targetUserID := targetUser.ID.String()
				existingDialog, diagErr := s.dialogRepo.GetPrivateDialogByMembers(ctx, userID, targetUserID)
				if diagErr == nil {
					return &chatpb.GetChatResponse{
						Chat: s.mapDBDialogToProto(existingDialog),
					}, nil
				}

				title := targetUser.FirstName
				if targetUser.LastName.Valid {
					title += " " + targetUser.LastName.String
				}

				chatRes := &chatpb.Chat{
					Id:           targetUserID,
					Type:         chatpb.ChatType_CHAT_TYPE_PRIVATE,
					Title:        title,
					MembersCount: 2,
				}

				if targetUser.Username.Valid {
					chatRes.Slug = targetUser.Username.String
				}

				return &chatpb.GetChatResponse{Chat: chatRes}, nil
			}
		}
	} else {
		return nil, status.Error(codes.InvalidArgument, "chat_id or slug required")
	}

	if err != nil {
		return nil, status.Error(codes.NotFound, "chat not found")
	}

	return &chatpb.GetChatResponse{
		Chat: s.mapDBDialogToProto(dialog),
	}, nil
}

func (s *Server) mapProtoTypeToDB(t chatpb.ChatType) string {
	switch t {
	case chatpb.ChatType_CHAT_TYPE_GROUP:
		return "group"
	case chatpb.ChatType_CHAT_TYPE_CHANNEL:
		return "channel"
	default:
		return "private"
	}
}

func (s *Server) mapDBDialogToProto(d dbgen.Dialog) *chatpb.Chat {
	res := &chatpb.Chat{
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
	if d.PhotoUrl.Valid {
		res.PhotoUrl = d.PhotoUrl.String
	}

	switch d.Type {
	case "group":
		res.Type = chatpb.ChatType_CHAT_TYPE_GROUP
	case "channel":
		res.Type = chatpb.ChatType_CHAT_TYPE_CHANNEL
	default:
		res.Type = chatpb.ChatType_CHAT_TYPE_PRIVATE
	}

	return res
}

func (s *Server) mapGetUserDialogsRowToProto(row dbgen.GetUserDialogsRow) *chatpb.Chat {
	res := s.mapDBDialogToProto(dbgen.Dialog{
		ID:            row.ID,
		Type:          row.Type,
		Name:          row.Name,
		Username:      row.Username,
		MembersCount:  row.MembersCount,
		LastMessageID: row.LastMessageID,
		IsVerified:    row.IsVerified,
		PhotoUrl:      row.PhotoUrl,
	})

	res.IsPinned = row.IsPinned
	res.UnreadCount = int32(row.UnreadCount)
	res.LastReadSequence = row.LastReadSequence

	if row.LastMessageID.Valid {
		msgPb := &messagespb.Message{
			Id:          row.LastMessageID.UUID.String(),
			ChatId:      row.ID.String(),
			Text:        row.MsgContent.String,
			IsEncrypted: row.MsgIsEncrypted.Bool,
			Sequence:    row.MsgSequence.Int64,
			SenderId:    row.MsgAuthorID.UUID.String(),
			SentAt:      row.MsgCreatedAt.Time.Format(time.RFC3339),
		}

		if row.MsgEncryptionIv.Valid {
			iv := row.MsgEncryptionIv.String
			msgPb.EncryptionIv = &iv
		}

		if row.MsgReplyToID.Valid {
			rid := row.MsgReplyToID.UUID.String()
			msgPb.ReplyToId = &rid
		}

		res.LastMessage = msgPb
	}

	return res
}
