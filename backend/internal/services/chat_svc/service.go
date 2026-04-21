package chat_svc

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
	chatpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/chat/v1"
	messagespb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/messages/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/infrastructure/limiter"
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
	limiter    limiter.RateLimiter
	cfg        config.ChatLimitConfig
}

func NewServer(db *database.DB, rdb *redis.Client, l limiter.RateLimiter, cfg config.ChatLimitConfig) *Server {
	return &Server{
		db:         db,
		rdb:        rdb,
		dialogRepo: repositories.NewDialogRepository(db),
		limiter:    l,
		cfg:        cfg,
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

func (s *Server) CreateChat(ctx context.Context, req *chatpb.CreateChatRequest) (*chatpb.CreateChatResponse, error) {
	creatorIDStr := s.getUserID(ctx, req.CreatorId)
	if creatorIDStr == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized")
	}

	if err := s.limiter.Check(ctx, "chat:create:"+creatorIDStr, s.cfg.Create.Limit, s.cfg.Create.Window); err != nil {
		return nil, status.Error(codes.ResourceExhausted, "too many chat creation requests")
	}

	if req.Type == chatpb.ChatType_CHAT_TYPE_PRIVATE {
		if len(req.ParticipantIds) != 2 {
			return nil, status.Error(codes.InvalidArgument, "private chat must have exactly 2 participants")
		}
		if req.ParticipantIds[0] == req.ParticipantIds[1] {
			return nil, status.Error(codes.InvalidArgument, "cannot create a private chat with yourself")
		}

		existingDialog, err := s.dialogRepo.GetPrivateDialogByMembers(ctx, req.ParticipantIds[0], req.ParticipantIds[1])
		if err == nil {
			return &chatpb.CreateChatResponse{Chat: s.mapDBDialogToProto(existingDialog)}, nil
		}
	}

	newID := uuid.New()
	creatorUUID, err := uuid.Parse(creatorIDStr)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid creator id")
	}

	dParams := dbgen.CreateDialogParams{
		ID:           newID,
		Type:         s.mapProtoTypeToDB(req.Type),
		Name:         database.ToNullString(req.Title),
		Username:     database.ToNullString(req.Slug),
		PhotoUrl:     sql.NullString{Valid: false},
		Bio:          sql.NullString{Valid: false},
		Description:  sql.NullString{Valid: false},
		InviteLink:   sql.NullString{Valid: false},
		CreatorID:    uuid.NullUUID{UUID: creatorUUID, Valid: true},
		MembersCount: int32(len(req.ParticipantIds)),
		IsActive:     true,
		IsVerified:   false,
	}

	mParams := make([]dbgen.AddDialogMemberParams, len(req.ParticipantIds))
	for i, pID := range req.ParticipantIds {
		pUUID, err := uuid.Parse(pID)
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid participant id")
		}

		role := "member"
		if pID == creatorIDStr {
			role = "owner"
		}
		mParams[i] = dbgen.AddDialogMemberParams{
			DialogID:         newID,
			UserID:           pUUID,
			Role:             role,
			NotificationsOn:  true,
			IsPinned:         false,
			LastReadSequence: 0,
		}
	}

	sParams := dbgen.CreateDialogSettingsParams{
		DialogID:            newID,
		Permissions:         0,
		SlowModeDelay:       0,
		IsHistoryHidden:     false,
		IsSignaturesEnabled: false,
	}

	if err := s.dialogRepo.CreateDialog(ctx, dParams, mParams, sParams); err != nil {
		log.Printf("[CreateChat] DB Error: %v", err)
		return nil, status.Error(codes.Internal, err.Error())
	}

	dialog, err := s.dialogRepo.GetDialogByID(ctx, newID.String())
	if err != nil {
		log.Printf("[CreateChat] Retrieval DB Error: %v", err)
		return nil, status.Error(codes.Internal, "failed to retrieve created chat")
	}
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

func (s *Server) InviteToChat(ctx context.Context, req *chatpb.InviteToChatRequest) (*chatpb.InviteToChatResponse, error) {
	inviterID := s.getUserID(ctx, "")
	if inviterID == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized")
	}

	did, err := uuid.Parse(req.ChatId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}
	iuid, err := uuid.Parse(inviterID)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid inviter id")
	}

	canInvite, err := s.checkPermission(ctx, did, iuid, 2)
	if err != nil {
		return nil, err
	}
	if !canInvite {
		return nil, status.Error(codes.PermissionDenied, "no permission to invite")
	}

	for _, targetID := range req.UserIds {
		tuid, err := uuid.Parse(targetID)
		if err != nil {
			continue
		}

		err = s.db.Queries.AddDialogMember(ctx, dbgen.AddDialogMemberParams{
			DialogID:         did,
			UserID:           tuid,
			Role:             "member",
			NotificationsOn:  true,
			IsPinned:         false,
			LastReadSequence: 0,
		})
		if err != nil {
			log.Printf("[InviteToChat] DB Error adding member %s: %v", targetID, err)
			continue
		}

		s.rdb.Publish(ctx, "user_chats:"+targetID, "{}")
	}

	return &chatpb.InviteToChatResponse{Success: true}, nil
}

func (s *Server) checkPermission(ctx context.Context, dialogID uuid.UUID, userID uuid.UUID, bit int32) (bool, error) {
	member, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
		DialogID: dialogID,
		UserID:   userID,
	})
	if err != nil {
		return false, status.Error(codes.NotFound, "member not found")
	}

	if member.Role == "owner" || member.Role == "admin" {
		return true, nil
	}

	settings, err := s.db.Queries.GetDialogSettings(ctx, dialogID)
	if err != nil {
		return false, nil
	}

	return (settings.Permissions & int64(bit)) == 0, nil
}

func (s *Server) PinChat(ctx context.Context, req *chatpb.PinChatRequest) (*chatpb.PinChatResponse, error) {
	userID := s.getUserID(ctx, req.UserId)
	if userID == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized access")
	}

	uUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid user id")
	}
	cUUID, err := uuid.Parse(req.ChatId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}

	err = s.db.Queries.UpdateMemberPinStatus(ctx, dbgen.UpdateMemberPinStatusParams{
		IsPinned: req.Pinned,
		DialogID: cUUID,
		UserID:   uUUID,
	})
	if err != nil {
		log.Printf("[PinChat] DB Error: %v", err)
		return nil, status.Error(codes.Internal, "failed to pin chat")
	}

	return &chatpb.PinChatResponse{Success: true}, nil
}

func (s *Server) DeleteChat(ctx context.Context, req *chatpb.DeleteChatRequest) (*chatpb.DeleteChatResponse, error) {
	userID := s.getUserID(ctx, req.UserId)
	if userID == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized access")
	}

	if err := s.limiter.Check(ctx, "chat:delete:"+userID, s.cfg.Delete.Limit, s.cfg.Delete.Window); err != nil {
		return nil, status.Error(codes.ResourceExhausted, "too many chat deletion requests")
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid user id")
	}
	did, err := uuid.Parse(req.ChatId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}

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
		log.Printf("[DeleteChat] DB Error: %v", err)
		return nil, status.Error(codes.Internal, "failed to delete chat")
	}

	return &chatpb.DeleteChatResponse{Success: true}, nil
}

func (s *Server) GetMyChats(ctx context.Context, req *chatpb.GetMyChatsRequest) (*chatpb.GetMyChatsResponse, error) {
	userID := s.getUserID(ctx, req.UserId)
	if userID == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized access")
	}

	dialogs, err := s.dialogRepo.GetUserDialogs(ctx, userID)
	if err != nil {
		log.Printf("[GetMyChats] DB Error: %v", err)
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
		if _, uuidErr := uuid.Parse(*req.ChatId); uuidErr != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid chat uuid")
		}
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
		log.Printf("[GetChat] DB Error: %v", err)
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
	if d.ID == uuid.Nil {
		return &chatpb.Chat{}
	}

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
			Id:       row.LastMessageID.UUID.String(),
			ChatId:   row.ID.String(),
			Text:     row.MsgContent.String,
			Sequence: row.MsgSequence.Int64,
			SenderId: row.MsgAuthorID.UUID.String(),
			SentAt:   row.MsgCreatedAt.Time.Format(time.RFC3339),
		}

		if row.MsgReplyToID.Valid {
			rid := row.MsgReplyToID.UUID.String()
			msgPb.ReplyToId = &rid
		}

		res.LastMessage = msgPb
	}

	return res
}
