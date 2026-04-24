package chat_svc

import (
	"context"
	"encoding/json"
	"sort"
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

const (
	PermSendMessages = 1
	PermSendMedia    = 2
	PermAddMembers   = 4
	PermPinMessages  = 8
	PermChangeInfo   = 16
)

const MaxAdminsLimit = 50

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
		return true, nil
	}
	return (settings.Permissions & int64(bit)) == 0, nil
}

func (s *Server) CreateChat(ctx context.Context, req *chatpb.CreateChatRequest) (*chatpb.CreateChatResponse, error) {
	creatorIDStr := s.getUserID(ctx, req.CreatorId)
	if creatorIDStr == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized")
	}

	if err := s.limiter.Check(ctx, "chat:create:"+creatorIDStr, s.cfg.Create.Limit, s.cfg.Create.Window); err != nil {
		return nil, status.Error(codes.ResourceExhausted, "limit exceeded")
	}

	if req.Type == chatpb.ChatType_CHAT_TYPE_PRIVATE {
		if len(req.ParticipantIds) != 2 {
			return nil, status.Error(codes.InvalidArgument, "invalid participants count")
		}
		existingDialog, err := s.dialogRepo.GetPrivateDialogByMembers(ctx, req.ParticipantIds[0], req.ParticipantIds[1])
		if err == nil {
			return &chatpb.CreateChatResponse{Chat: s.mapDBDialogToProto(existingDialog, 0, "member")}, nil
		}
	}

	newID := uuid.New()
	creatorUUID, err := uuid.Parse(creatorIDStr)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid creator id")
	}

	participantsMap := make(map[string]bool)
	participantsMap[creatorIDStr] = true
	for _, pid := range req.ParticipantIds {
		participantsMap[pid] = true
	}

	dParams := dbgen.CreateDialogParams{
		ID:           newID,
		Type:         s.mapProtoTypeToDB(req.Type),
		Name:         database.ToNullString(req.Title),
		Username:     database.ToNullString(req.Slug),
		CreatorID:    uuid.NullUUID{UUID: creatorUUID, Valid: true},
		MembersCount: int32(len(participantsMap)),
		IsActive:     true,
	}

	mParams := make([]dbgen.AddDialogMemberParams, 0, len(participantsMap))
	for pID := range participantsMap {
		pUUID, _ := uuid.Parse(pID)
		role := "member"
		if pID == creatorIDStr {
			role = "owner"
		}
		mParams = append(mParams, dbgen.AddDialogMemberParams{
			DialogID:        newID,
			UserID:          pUUID,
			Role:            role,
			NotificationsOn: true,
		})
	}

	var defaultPerms int64 = 0
	if req.Type == chatpb.ChatType_CHAT_TYPE_CHANNEL {
		defaultPerms = PermSendMessages | PermSendMedia | PermAddMembers | PermPinMessages | PermChangeInfo
	}

	sParams := dbgen.CreateDialogSettingsParams{
		DialogID:    newID,
		Permissions: defaultPerms,
	}

	if err := s.dialogRepo.CreateDialog(ctx, dParams, mParams, sParams); err != nil {
		return nil, status.Error(codes.Internal, "database error")
	}

	dialog, _ := s.dialogRepo.GetDialogByID(ctx, newID.String())
	protoChat := s.mapDBDialogToProto(dialog, defaultPerms, "owner")
	protoChat.CanWrite = true
	protoChat.Permissions = s.calculatePermissions(dialog.Type, defaultPerms, "owner")

	notification := map[string]interface{}{
		"id":        protoChat.Id,
		"title":     protoChat.Title,
		"type":      strings.ToUpper(strings.TrimPrefix(req.Type.String(), "CHAT_TYPE_")),
		"createdAt": time.Now().Format(time.RFC3339),
	}

	payload, _ := json.Marshal(notification)
	for pID := range participantsMap {
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
	iuid, _ := uuid.Parse(inviterID)

	canInvite, err := s.checkPermission(ctx, did, iuid, PermAddMembers)
	if err != nil || !canInvite {
		return nil, status.Error(codes.PermissionDenied, "access denied")
	}

	addedCount := 0
	for _, targetID := range req.UserIds {
		if targetID == inviterID {
			continue
		}
		tuid, _ := uuid.Parse(targetID)
		_, checkErr := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: did, UserID: tuid})
		if checkErr != nil {
			_ = s.db.Queries.AddDialogMember(ctx, dbgen.AddDialogMemberParams{
				DialogID: did, UserID: tuid, Role: "member", NotificationsOn: true,
			})
			addedCount++
			s.rdb.Publish(ctx, "user_chats:"+targetID, "{}")
		}
	}

	for i := 0; i < addedCount; i++ {
		_ = s.db.Queries.IncrementMembersCount(ctx, did)
	}

	return &chatpb.InviteToChatResponse{Success: true}, nil
}

func (s *Server) JoinChatBySlug(ctx context.Context, req *chatpb.JoinChatBySlugRequest) (*chatpb.JoinChatBySlugResponse, error) {
	userIDStr := s.getUserID(ctx, "")
	if userIDStr == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized")
	}

	uID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid user id")
	}

	slug := strings.TrimPrefix(req.Slug, "@")
	dialog, err := s.dialogRepo.GetDialogByUsername(ctx, slug)
	if err != nil {
		return nil, status.Error(codes.NotFound, "chat not found")
	}

	if dialog.Type == "private" {
		return nil, status.Error(codes.PermissionDenied, "cannot join private chat by slug")
	}

	_, checkErr := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
		DialogID: dialog.ID,
		UserID:   uID,
	})
	if checkErr == nil {
		return &chatpb.JoinChatBySlugResponse{
			ChatId:  dialog.ID.String(),
			Success: true,
		}, nil
	}

	err = s.db.Queries.AddDialogMember(ctx, dbgen.AddDialogMemberParams{
		DialogID:        dialog.ID,
		UserID:          uID,
		Role:            "member",
		NotificationsOn: true,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to join")
	}

	_ = s.db.Queries.IncrementMembersCount(ctx, dialog.ID)

	chatProto := s.mapDBDialogToProto(dialog, 0, "member")
	payload, _ := json.Marshal(chatProto)
	s.rdb.Publish(ctx, "user_chats:"+userIDStr, payload)

	return &chatpb.JoinChatBySlugResponse{
		ChatId:  dialog.ID.String(),
		Success: true,
	}, nil
}

func (s *Server) GetChatMembers(ctx context.Context, req *chatpb.GetChatMembersRequest) (*chatpb.GetChatMembersResponse, error) {
	authID := s.getUserID(ctx, "")
	if authID == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized")
	}

	did, err := uuid.Parse(req.ChatId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}
	auid, _ := uuid.Parse(authID)

	dialog, err := s.dialogRepo.GetDialogByID(ctx, req.ChatId)
	if err != nil {
		return nil, status.Error(codes.NotFound, "chat not found")
	}

	member, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: did, UserID: auid})
	if err != nil {
		return nil, status.Error(codes.PermissionDenied, "not a member")
	}

	if dialog.Type == "channel" && member.Role != "owner" && member.Role != "admin" {
		return nil, status.Error(codes.PermissionDenied, "only admins can view channel members")
	}

	dbMembers, err := s.db.Queries.GetDialogMembers(ctx, did)
	if err != nil {
		return nil, status.Error(codes.Internal, "database error")
	}

	settings, _ := s.db.Queries.GetDialogSettings(ctx, did)

	sort.Slice(dbMembers, func(i, j int) bool {
		roles := map[string]int{"owner": 0, "admin": 1, "member": 2}
		return roles[dbMembers[i].Role] < roles[dbMembers[j].Role]
	})

	total := len(dbMembers)
	start := min(int(req.Offset), total)
	end := start + int(req.Limit)
	if req.Limit == 0 {
		end = start + 50
	}
	if end > total {
		end = total
	}

	slice := dbMembers[start:end]
	res := make([]*chatpb.ChatMember, 0, len(slice))
	for _, m := range slice {
		res = append(res, &chatpb.ChatMember{
			UserId:      m.UserID.String(),
			Role:        m.Role,
			Permissions: s.calculatePermissions(dialog.Type, settings.Permissions, m.Role),
		})
	}

	return &chatpb.GetChatMembersResponse{
		Members:    res,
		TotalCount: int32(total),
	}, nil
}

func (s *Server) GetMyChats(ctx context.Context, req *chatpb.GetMyChatsRequest) (*chatpb.GetMyChatsResponse, error) {
	userID := s.getUserID(ctx, req.UserId)
	if userID == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized")
	}

	dialogs, err := s.dialogRepo.GetUserDialogs(ctx, userID)
	if err != nil {
		return nil, status.Error(codes.Internal, "retrieval failed")
	}

	res := make([]*chatpb.Chat, 0, len(dialogs))
	for _, d := range dialogs {
		settings, _ := s.db.Queries.GetDialogSettings(ctx, d.ID)
		proto := s.mapGetUserDialogsRowToProto(d)
		proto.CanWrite = s.calculateCanWrite(d.Type, settings.Permissions, d.Role, d.IsActive)
		proto.Permissions = s.calculatePermissions(d.Type, settings.Permissions, d.Role)
		res = append(res, proto)
	}

	return &chatpb.GetMyChatsResponse{Chats: res}, nil
}

func (s *Server) GetChat(ctx context.Context, req *chatpb.GetChatRequest) (*chatpb.GetChatResponse, error) {
	userID := s.getUserID(ctx, req.UserId)
	var dialog dbgen.Dialog
	var err error

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
				existing, diagErr := s.dialogRepo.GetPrivateDialogByMembers(ctx, userID, targetUserID)
				if diagErr == nil {
					dialog = existing
				} else {
					return &chatpb.GetChatResponse{Chat: &chatpb.Chat{
						Id: targetUserID, Type: chatpb.ChatType_CHAT_TYPE_PRIVATE, Title: targetUser.FirstName,
						MembersCount: 2, Slug: targetUser.Username.String, CanWrite: true,
						Permissions: s.calculatePermissions("private", 0, "member"),
					}}, nil
				}
			}
		}
	}

	if err != nil {
		return nil, status.Error(codes.NotFound, "chat not found")
	}

	var role string = "guest"
	var perms int64 = 0
	if userID != "" {
		uUUID, _ := uuid.Parse(userID)
		m, getErr := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: dialog.ID, UserID: uUUID})
		if getErr == nil {
			role = m.Role
		}
		settings, setErr := s.db.Queries.GetDialogSettings(ctx, dialog.ID)
		if setErr == nil {
			perms = settings.Permissions
		}
	}

	protoChat := s.mapDBDialogToProto(dialog, perms, role)
	protoChat.CanWrite = s.calculateCanWrite(dialog.Type, perms, role, dialog.IsActive)
	protoChat.Permissions = s.calculatePermissions(dialog.Type, perms, role)

	return &chatpb.GetChatResponse{Chat: protoChat}, nil
}

func (s *Server) calculateCanWrite(chatType string, permissions int64, role string, isActive bool) bool {
	if !isActive {
		return false
	}
	if role == "owner" || role == "admin" {
		return true
	}
	if chatType == "channel" || role == "guest" {
		return false
	}
	return (permissions & PermSendMessages) == 0
}

func (s *Server) calculatePermissions(chatType string, permissions int64, role string) *chatpb.ChatPermissions {
	var isAdmin bool = role == "owner" || role == "admin"
	if chatType == "private" {
		return &chatpb.ChatPermissions{CanSendMessage: true, CanInviteUsers: false, CanDeleteMessages: true}
	}
	return &chatpb.ChatPermissions{
		CanSendMessage:    isAdmin || (permissions&PermSendMessages) == 0,
		CanInviteUsers:    isAdmin || (permissions&PermAddMembers) == 0,
		CanEditMetadata:   isAdmin,
		CanDeleteMessages: isAdmin,
		CanAssignAdmins:   role == "owner",
		CanSendMedia:      isAdmin || (permissions&PermSendMedia) == 0,
		CanPinMessages:    isAdmin || (permissions&PermPinMessages) == 0,
	}
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

func (s *Server) mapDBDialogToProto(d dbgen.Dialog, perms int64, role string) *chatpb.Chat {
	res := &chatpb.Chat{Id: d.ID.String(), MembersCount: int32(d.MembersCount), IsVerified: d.IsVerified, MyRole: role}
	if d.Name.Valid {
		res.Title = d.Name.String
	}
	if d.Username.Valid {
		res.Slug = d.Username.String
	}
	if d.PhotoUrl.Valid {
		res.PhotoUrl = d.PhotoUrl.String
	}
	if d.LastMessageID.Valid {
		res.LastMessageId = d.LastMessageID.UUID.String()
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
		ID: row.ID, Type: row.Type, Name: row.Name, Username: row.Username,
		MembersCount: row.MembersCount, IsVerified: row.IsVerified, PhotoUrl: row.PhotoUrl, LastMessageID: row.LastMessageID,
	}, 0, row.Role)

	res.IsPinned = row.IsPinned
	res.UnreadCount = int32(row.UnreadCount)
	res.LastReadSequence = row.LastReadSequence

	if row.LastMessageID.Valid {
		res.LastMessage = &messagespb.Message{
			Id:       row.LastMessageID.UUID.String(),
			Text:     row.MsgContent.String,
			Sequence: row.MsgSequence.Int64,
			SenderId: row.MsgAuthorID.UUID.String(),
			SentAt:   row.MsgCreatedAt.Time.Format(time.RFC3339),
		}
	}
	return res
}

func (s *Server) PinChat(ctx context.Context, req *chatpb.PinChatRequest) (*chatpb.PinChatResponse, error) {
	userID := s.getUserID(ctx, req.UserId)
	uUUID, _ := uuid.Parse(userID)
	cUUID, _ := uuid.Parse(req.ChatId)
	_ = s.db.Queries.UpdateMemberPinStatus(ctx, dbgen.UpdateMemberPinStatusParams{
		IsPinned: req.Pinned, DialogID: cUUID, UserID: uUUID,
	})
	return &chatpb.PinChatResponse{Success: true}, nil
}

func (s *Server) DeleteChat(ctx context.Context, req *chatpb.DeleteChatRequest) (*chatpb.DeleteChatResponse, error) {
	userID := s.getUserID(ctx, req.UserId)
	uid, _ := uuid.Parse(userID)
	did, _ := uuid.Parse(req.ChatId)

	dialog, _ := s.dialogRepo.GetDialogByID(ctx, req.ChatId)
	member, _ := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: did, UserID: uid})

	if req.ForEveryone {
		if dialog.Type == "private" || member.Role == "owner" {
			_ = s.db.Queries.DeleteDialog(ctx, did)
			s.rdb.Publish(ctx, "chat_deleted:"+req.ChatId, "{}")
			return &chatpb.DeleteChatResponse{Success: true}, nil
		}
		return nil, status.Error(codes.PermissionDenied, "only owner can delete for everyone")
	}

	_ = s.db.Queries.HideDialogMember(ctx, dbgen.HideDialogMemberParams{DialogID: did, UserID: uid})
	return &chatpb.DeleteChatResponse{Success: true}, nil
}

func (s *Server) LeaveChat(ctx context.Context, req *chatpb.LeaveChatRequest) (*chatpb.LeaveChatResponse, error) {
	userID := s.getUserID(ctx, "")
	uid, _ := uuid.Parse(userID)
	did, _ := uuid.Parse(req.ChatId)

	dialog, err := s.dialogRepo.GetDialogByID(ctx, req.ChatId)
	if err != nil {
		return nil, status.Error(codes.NotFound, "chat not found")
	}

	member, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: did, UserID: uid})
	if err != nil {
		return nil, status.Error(codes.NotFound, "not a member")
	}

	if member.Role == "owner" && dialog.MembersCount > 1 {
		heirID, err := s.db.Queries.FindNewDialogOwner(ctx, dbgen.FindNewDialogOwnerParams{
			DialogID: did,
			UserID:   uid,
		})

		if err == nil {
			_ = s.db.Queries.UpdateDialogMemberRole(ctx, dbgen.UpdateDialogMemberRoleParams{
				DialogID: did,
				UserID:   heirID,
				Role:     "owner",
			})
			_ = s.db.Queries.UpdateDialogCreator(ctx, dbgen.UpdateDialogCreatorParams{
				ID:        did,
				CreatorID: uuid.NullUUID{UUID: heirID, Valid: true},
			})
		}
	}

	_ = s.db.Queries.RemoveDialogMember(ctx, dbgen.RemoveDialogMemberParams{DialogID: did, UserID: uid})
	_ = s.db.Queries.DecrementMembersCount(ctx, did)

	if dialog.MembersCount <= 1 {
		_ = s.db.Queries.DeleteDialog(ctx, did)
	}

	s.rdb.Publish(ctx, "user_chats_leave:"+userID, req.ChatId)
	return &chatpb.LeaveChatResponse{Success: true}, nil
}

func (s *Server) RemoveChatMember(ctx context.Context, req *chatpb.RemoveChatMemberRequest) (*chatpb.RemoveChatMemberResponse, error) {
	authID := s.getUserID(ctx, "")
	if authID == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized")
	}

	did, _ := uuid.Parse(req.ChatId)
	auid, _ := uuid.Parse(authID)
	tuid, _ := uuid.Parse(req.UserId)

	if auid == tuid {
		return nil, status.Error(codes.InvalidArgument, "use LeaveChat to leave")
	}

	requester, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: did, UserID: auid})
	if err != nil || (requester.Role != "owner" && requester.Role != "admin") {
		return nil, status.Error(codes.PermissionDenied, "insufficient permissions")
	}

	target, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: did, UserID: tuid})
	if err != nil {
		return nil, status.Error(codes.NotFound, "target user not found in chat")
	}

	if (target.Role == "owner") || (target.Role == "admin" && requester.Role != "owner") {
		return nil, status.Error(codes.PermissionDenied, "cannot remove user with higher or equal role")
	}

	err = s.db.Queries.RemoveDialogMember(ctx, dbgen.RemoveDialogMemberParams{
		DialogID: did,
		UserID:   tuid,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to remove member")
	}

	_ = s.db.Queries.DecrementMembersCount(ctx, did)

	s.rdb.Publish(ctx, "user_chats_kicked:"+req.UserId, req.ChatId)

	return &chatpb.RemoveChatMemberResponse{Success: true}, nil
}

func (s *Server) UpdateMemberRole(ctx context.Context, req *chatpb.UpdateMemberRoleRequest) (*chatpb.UpdateMemberRoleResponse, error) {
	authID := s.getUserID(ctx, "")
	auid, _ := uuid.Parse(authID)
	did, _ := uuid.Parse(req.ChatId)
	tuid, _ := uuid.Parse(req.TargetUserId)

	admin, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: did, UserID: auid})
	if err != nil || admin.Role != "owner" {
		return nil, status.Error(codes.PermissionDenied, "only owner can change roles")
	}

	if req.NewRole == "admin" {
		currentAdmins, err := s.db.Queries.CountDialogAdmins(ctx, did)
		if err != nil {
			return nil, status.Error(codes.Internal, "failed to count admins")
		}
		if currentAdmins >= MaxAdminsLimit {
			return nil, status.Error(codes.ResourceExhausted, "too many admins in this chat")
		}
	}

	if req.NewRole == "owner" {
		_ = s.db.Queries.UpdateDialogMemberRole(ctx, dbgen.UpdateDialogMemberRoleParams{
			DialogID: did, UserID: tuid, Role: "owner",
		})
		_ = s.db.Queries.UpdateDialogMemberRole(ctx, dbgen.UpdateDialogMemberRoleParams{
			DialogID: did, UserID: auid, Role: "admin",
		})
		_ = s.db.Queries.UpdateDialogCreator(ctx, dbgen.UpdateDialogCreatorParams{
			ID:        did,
			CreatorID: uuid.NullUUID{UUID: tuid, Valid: true},
		})
	} else {
		_ = s.db.Queries.UpdateDialogMemberRole(ctx, dbgen.UpdateDialogMemberRoleParams{
			DialogID: did, UserID: tuid, Role: req.NewRole,
		})
	}

	return &chatpb.UpdateMemberRoleResponse{Success: true}, nil
}

func (s *Server) UpdateChatPermissions(ctx context.Context, req *chatpb.UpdateChatPermissionsRequest) (*chatpb.UpdateChatPermissionsResponse, error) {
	authID := s.getUserID(ctx, "")
	auid, _ := uuid.Parse(authID)
	did, _ := uuid.Parse(req.ChatId)

	admin, _ := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: did, UserID: auid})
	if admin.Role != "owner" && admin.Role != "admin" {
		return nil, status.Error(codes.PermissionDenied, "insufficient permissions")
	}

	var bitmask int64 = 0
	if !req.Permissions.CanSendMessage {
		bitmask |= PermSendMessages
	}
	if !req.Permissions.CanInviteUsers {
		bitmask |= PermAddMembers
	}
	if !req.Permissions.CanPinMessages {
		bitmask |= PermPinMessages
	}
	if !req.Permissions.CanSendMedia {
		bitmask |= PermSendMedia
	}

	_ = s.db.Queries.UpdateDialogSettings(ctx, dbgen.UpdateDialogSettingsParams{
		DialogID: did, Permissions: bitmask,
	})

	return &chatpb.UpdateChatPermissionsResponse{Success: true}, nil
}
