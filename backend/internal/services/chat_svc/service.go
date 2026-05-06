package chat_svc

import (
	"context"
	"database/sql"
	"encoding/json"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/tr1xdev/aerogram-messenger/internal/config"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/helpers"
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
		return helpers.ToRawID(reqID)
	}
	md, ok := metadata.FromIncomingContext(ctx)
	if ok {
		if ids := md.Get("user-id"); len(ids) > 0 {
			return helpers.ToRawID(ids[0])
		}
	}
	return ""
}

func (s *Server) checkPermission(ctx context.Context, dialogID, userID uuid.UUID, bit int32) (bool, error) {
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
			return nil, status.Error(codes.InvalidArgument, "invalid participants")
		}
		p1, p2 := helpers.ToRawID(req.ParticipantIds[0]), helpers.ToRawID(req.ParticipantIds[1])
		if diag, err := s.dialogRepo.GetPrivateDialogByMembers(ctx, p1, p2); err == nil {
			return &chatpb.CreateChatResponse{Chat: s.mapDBDialogToProto(diag, 0, "member", 0)}, nil
		}
	}

	creatorUUID, _ := uuid.Parse(creatorIDStr)
	newID := uuid.New()
	participantsMap := make(map[string]bool)
	participantsMap[creatorIDStr] = true
	for _, pid := range req.ParticipantIds {
		participantsMap[helpers.ToRawID(pid)] = true
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
			DialogID: newID, UserID: pUUID, Role: role, NotificationsOn: true,
		})
	}

	var defaultPerms int64 = 0
	if req.Type == chatpb.ChatType_CHAT_TYPE_CHANNEL {
		defaultPerms = PermSendMessages | PermSendMedia | PermAddMembers | PermPinMessages | PermChangeInfo
	}

	if err := s.dialogRepo.CreateDialog(ctx, dParams, mParams, dbgen.CreateDialogSettingsParams{
		DialogID: newID, Permissions: defaultPerms,
	}); err != nil {
		return nil, status.Error(codes.Internal, "failed to create chat")
	}

	dialog, _ := s.dialogRepo.GetDialogByID(ctx, newID.String())
	proto := s.mapDBDialogToProto(dialog, defaultPerms, "owner", 0)
	proto.CanWrite = true
	proto.Permissions = s.calculatePermissions(dialog.Type, defaultPerms, "owner")

	payload, _ := json.Marshal(proto)
	for pID := range participantsMap {
		s.rdb.Publish(ctx, "user_chats:"+pID, payload)
	}

	return &chatpb.CreateChatResponse{Chat: proto}, nil
}

func (s *Server) GetChat(ctx context.Context, req *chatpb.GetChatRequest) (*chatpb.GetChatResponse, error) {
	userID := s.getUserID(ctx, req.UserId)
	var dialog dbgen.Dialog
	var err error

	if req.ChatId != nil && *req.ChatId != "" {
		dialog, err = s.dialogRepo.GetDialogByID(ctx, helpers.ToRawID(*req.ChatId))
	} else if req.Slug != nil && *req.Slug != "" {
		slug := strings.TrimPrefix(*req.Slug, "@")
		dialog, err = s.dialogRepo.GetDialogByUsername(ctx, slug)

		if err != nil && userID != "" {
			userRepo := repositories.NewUserRepository(s.db)
			if target, uErr := userRepo.GetByUsername(ctx, slug); uErr == nil {
				targetID := target.ID.String()
				if existing, diagErr := s.dialogRepo.GetPrivateDialogByMembers(ctx, userID, targetID); diagErr == nil {
					dialog = existing
					err = nil
				} else {
					return &chatpb.GetChatResponse{Chat: &chatpb.Chat{
						Id:           targetID,
						Type:         chatpb.ChatType_CHAT_TYPE_PRIVATE,
						Title:        target.FirstName,
						Slug:         target.Username.String,
						MembersCount: 2,
						CanWrite:     true,
						Permissions:  s.calculatePermissions("private", 0, "member"),
					}}, nil
				}
			}
		}
	}

	if err != nil {
		return nil, status.Error(codes.NotFound, "chat not found")
	}

	role, lastRead, perms := "guest", int64(0), int64(0)
	if userID != "" {
		uUUID, _ := uuid.Parse(userID)
		if m, mErr := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: dialog.ID, UserID: uUUID}); mErr == nil {
			role, lastRead = m.Role, m.LastReadSequence
		}
		if set, sErr := s.db.Queries.GetDialogSettings(ctx, dialog.ID); sErr == nil {
			perms = set.Permissions
		}
	}

	proto := s.mapDBDialogToProto(dialog, perms, role, lastRead)
	proto.CanWrite = s.calculateCanWrite(dialog.Type, perms, role, dialog.IsActive)
	proto.Permissions = s.calculatePermissions(dialog.Type, perms, role)

	return &chatpb.GetChatResponse{Chat: proto}, nil
}

func (s *Server) GetMyChats(ctx context.Context, req *chatpb.GetMyChatsRequest) (*chatpb.GetMyChatsResponse, error) {
	userID := s.getUserID(ctx, req.UserId)
	if userID == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized")
	}

	rows, err := s.dialogRepo.GetUserDialogs(ctx, userID)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to fetch chats")
	}

	res := make([]*chatpb.Chat, 0, len(rows))
	for _, r := range rows {
		settings, _ := s.db.Queries.GetDialogSettings(ctx, r.ID)
		proto := s.mapGetUserDialogsRowToProto(r)
		proto.CanWrite = s.calculateCanWrite(r.Type, settings.Permissions, r.Role, r.IsActive)
		proto.Permissions = s.calculatePermissions(r.Type, settings.Permissions, r.Role)
		res = append(res, proto)
	}

	return &chatpb.GetMyChatsResponse{Chats: res}, nil
}

func (s *Server) GetChatMembers(ctx context.Context, req *chatpb.GetChatMembersRequest) (*chatpb.GetChatMembersResponse, error) {
	authID := s.getUserID(ctx, "")
	if authID == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized")
	}

	did, _ := uuid.Parse(helpers.ToRawID(req.ChatId))
	auid, _ := uuid.Parse(authID)

	dialog, err := s.dialogRepo.GetDialogByID(ctx, did.String())
	if err != nil {
		return nil, status.Error(codes.NotFound, "chat not found")
	}

	m, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: did, UserID: auid})
	if err != nil {
		return nil, status.Error(codes.PermissionDenied, "not a member")
	}

	if dialog.Type == "channel" && m.Role != "owner" && m.Role != "admin" {
		return nil, status.Error(codes.PermissionDenied, "admin only")
	}

	dbMembers, _ := s.db.Queries.GetDialogMembers(ctx, did)
	settings, _ := s.db.Queries.GetDialogSettings(ctx, did)

	sort.Slice(dbMembers, func(i, j int) bool {
		roles := map[string]int{"owner": 0, "admin": 1, "member": 2}
		return roles[dbMembers[i].Role] < roles[dbMembers[j].Role]
	})

	total := len(dbMembers)
	start := min(int(req.Offset), total)
	end := min(start+int(req.Limit), total)
	if req.Limit == 0 {
		end = min(start+50, total)
	}

	res := make([]*chatpb.ChatMember, 0, end-start)
	for _, m := range dbMembers[start:end] {
		res = append(res, &chatpb.ChatMember{
			UserId:           m.UserID.String(),
			Role:             m.Role,
			Permissions:      s.calculatePermissions(dialog.Type, settings.Permissions, m.Role),
			LastReadSequence: m.LastReadSequence,
		})
	}

	return &chatpb.GetChatMembersResponse{Members: res, TotalCount: int32(total)}, nil
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

func (s *Server) calculatePermissions(chatType string, perms int64, role string) *chatpb.ChatPermissions {
	isAdmin := role == "owner" || role == "admin"
	if chatType == "private" {
		return &chatpb.ChatPermissions{CanSendMessage: true, CanDeleteMessages: true}
	}
	check := func(bit int32) bool { return isAdmin || (perms&int64(bit)) == 0 }
	return &chatpb.ChatPermissions{
		CanSendMessage:    check(PermSendMessages),
		CanInviteUsers:    check(PermAddMembers),
		CanEditMetadata:   isAdmin,
		CanDeleteMessages: isAdmin,
		CanAssignAdmins:   role == "owner",
		CanSendMedia:      check(PermSendMedia),
		CanPinMessages:    check(PermPinMessages),
	}
}

func (s *Server) mapDBDialogToProto(d dbgen.Dialog, perms int64, role string, lastRead int64) *chatpb.Chat {
	res := &chatpb.Chat{
		Id:               d.ID.String(),
		MembersCount:     int32(d.MembersCount),
		IsVerified:       d.IsVerified,
		MyRole:           role,
		LastReadSequence: lastRead,
	}
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
	}, 0, row.Role, row.LastReadSequence)

	res.IsPinned = row.IsPinned
	res.UnreadCount = int32(row.UnreadCount)

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

func (s *Server) mapProtoTypeToDB(t chatpb.ChatType) string {
	if t == chatpb.ChatType_CHAT_TYPE_GROUP {
		return "group"
	}
	if t == chatpb.ChatType_CHAT_TYPE_CHANNEL {
		return "channel"
	}
	return "private"
}

func (s *Server) JoinChatBySlug(ctx context.Context, req *chatpb.JoinChatBySlugRequest) (*chatpb.JoinChatBySlugResponse, error) {
	userID := s.getUserID(ctx, "")
	uUUID, _ := uuid.Parse(userID)
	slug := strings.TrimPrefix(req.Slug, "@")

	dialog, err := s.dialogRepo.GetDialogByUsername(ctx, slug)
	if err != nil {
		return nil, status.Error(codes.NotFound, "chat not found")
	}
	if dialog.Type == "private" {
		return nil, status.Error(codes.PermissionDenied, "cannot join private")
	}

	if _, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: dialog.ID, UserID: uUUID}); err == nil {
		return &chatpb.JoinChatBySlugResponse{ChatId: dialog.ID.String(), Success: true}, nil
	}

	if err := s.db.Queries.AddDialogMember(ctx, dbgen.AddDialogMemberParams{
		DialogID: dialog.ID, UserID: uUUID, Role: "member", NotificationsOn: true,
	}); err != nil {
		return nil, status.Error(codes.Internal, "failed to join")
	}

	_ = s.db.Queries.IncrementMembersCount(ctx, dialog.ID)
	s.rdb.Publish(ctx, "user_chats:"+userID, "{}")

	return &chatpb.JoinChatBySlugResponse{ChatId: dialog.ID.String(), Success: true}, nil
}

func (s *Server) LeaveChat(ctx context.Context, req *chatpb.LeaveChatRequest) (*chatpb.LeaveChatResponse, error) {
	userID := s.getUserID(ctx, "")
	uid, _ := uuid.Parse(userID)
	did, _ := uuid.Parse(helpers.ToRawID(req.ChatId))

	dialog, err := s.dialogRepo.GetDialogByID(ctx, did.String())
	if err != nil {
		return nil, status.Error(codes.NotFound, "chat not found")
	}

	m, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: did, UserID: uid})
	if err != nil {
		return nil, status.Error(codes.NotFound, "not a member")
	}

	if m.Role == "owner" && dialog.MembersCount > 1 {
		if heir, err := s.db.Queries.FindNewDialogOwner(ctx, dbgen.FindNewDialogOwnerParams{DialogID: did, UserID: uid}); err == nil {
			_ = s.db.Queries.UpdateDialogMemberRole(ctx, dbgen.UpdateDialogMemberRoleParams{DialogID: did, UserID: heir, Role: "owner"})
			_ = s.db.Queries.UpdateDialogCreator(ctx, dbgen.UpdateDialogCreatorParams{ID: did, CreatorID: uuid.NullUUID{UUID: heir, Valid: true}})
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

func (s *Server) PinChat(ctx context.Context, req *chatpb.PinChatRequest) (*chatpb.PinChatResponse, error) {
	uid, _ := uuid.Parse(s.getUserID(ctx, req.UserId))
	did, _ := uuid.Parse(helpers.ToRawID(req.ChatId))
	_ = s.db.Queries.UpdateMemberPinStatus(ctx, dbgen.UpdateMemberPinStatusParams{IsPinned: req.Pinned, DialogID: did, UserID: uid})
	return &chatpb.PinChatResponse{Success: true}, nil
}

func (s *Server) UpdateChat(ctx context.Context, req *chatpb.UpdateChatRequest) (*chatpb.UpdateChatResponse, error) {
	authID := s.getUserID(ctx, "")
	auid, _ := uuid.Parse(authID)
	did, _ := uuid.Parse(helpers.ToRawID(req.ChatId))

	canEdit, err := s.checkPermission(ctx, did, auid, PermChangeInfo)
	if err != nil || !canEdit {
		return nil, status.Error(codes.PermissionDenied, "access denied")
	}

	var newSlug sql.NullString
	if req.Slug != nil && *req.Slug != "" {
		clean := strings.TrimPrefix(*req.Slug, "@")
		newSlug = database.ToNullString(&clean)
	}

	updated, err := s.db.Queries.UpdateChatMetadata(ctx, dbgen.UpdateChatMetadataParams{
		ID:          did,
		Name:        database.ToNullString(req.Title),
		Username:    newSlug,
		Description: database.ToNullString(req.Description),
		PhotoUrl:    database.ToNullString(req.PhotoUrl),
	})
	if err != nil {
		if strings.Contains(err.Error(), "unique constraint") {
			return nil, status.Error(codes.AlreadyExists, "slug taken")
		}
		return nil, status.Error(codes.Internal, "update failed")
	}

	proto := s.mapDBDialogToProto(updated, 0, "admin", 0)
	payload, _ := json.Marshal(map[string]interface{}{"event": "CHAT_UPDATED", "chat": proto})
	s.rdb.Publish(ctx, "chat_updates:"+helpers.ToRawID(req.ChatId), payload)

	return &chatpb.UpdateChatResponse{Chat: proto}, nil
}

func (s *Server) UpdateChatPermissions(ctx context.Context, req *chatpb.UpdateChatPermissionsRequest) (*chatpb.UpdateChatPermissionsResponse, error) {
	authID := s.getUserID(ctx, "")
	auid, _ := uuid.Parse(authID)
	did, _ := uuid.Parse(helpers.ToRawID(req.ChatId))

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

	_ = s.db.Queries.UpdateDialogSettings(ctx, dbgen.UpdateDialogSettingsParams{DialogID: did, Permissions: bitmask})
	return &chatpb.UpdateChatPermissionsResponse{Success: true}, nil
}

func (s *Server) InviteToChat(ctx context.Context, req *chatpb.InviteToChatRequest) (*chatpb.InviteToChatResponse, error) {
	inviterID := s.getUserID(ctx, "")
	did, _ := uuid.Parse(helpers.ToRawID(req.ChatId))
	auid, _ := uuid.Parse(inviterID)

	canInvite, err := s.checkPermission(ctx, did, auid, PermAddMembers)
	if err != nil || !canInvite {
		return nil, status.Error(codes.PermissionDenied, "access denied")
	}

	addedCount := 0
	for _, targetID := range req.UserIds {
		raw := helpers.ToRawID(targetID)
		if raw == inviterID {
			continue
		}
		tuid, _ := uuid.Parse(raw)
		if _, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: did, UserID: tuid}); err != nil {
			_ = s.db.Queries.AddDialogMember(ctx, dbgen.AddDialogMemberParams{
				DialogID: did, UserID: tuid, Role: "member", NotificationsOn: true,
			})
			addedCount++
			s.rdb.Publish(ctx, "user_chats:"+raw, "{}")
		}
	}

	for i := 0; i < addedCount; i++ {
		_ = s.db.Queries.IncrementMembersCount(ctx, did)
	}

	return &chatpb.InviteToChatResponse{Success: true}, nil
}

func (s *Server) ExportChatInvite(ctx context.Context, req *chatpb.ExportChatInviteRequest) (*chatpb.ExportChatInviteResponse, error) {
	authID := s.getUserID(ctx, "")
	did, _ := uuid.Parse(helpers.ToRawID(req.ChatId))
	auid, _ := uuid.Parse(authID)

	canInvite, err := s.checkPermission(ctx, did, auid, PermAddMembers)
	if err != nil || !canInvite {
		return nil, status.Error(codes.PermissionDenied, "access denied")
	}

	code := uuid.New().String()[:12]
	var expireAt sql.NullTime
	if req.ExpireAt != nil {
		expireAt = database.TimeToNullTime(time.Unix(*req.ExpireAt, 0))
	}

	invite, err := s.db.Queries.CreateDialogInvite(ctx, dbgen.CreateDialogInviteParams{
		DialogID:   did,
		CreatorID:  auid,
		InviteCode: code,
		Name:       database.ToNullString(req.Name),
		UsageLimit: database.ToNullInt32(req.UsageLimit),
		ExpireAt:   expireAt,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to create invite")
	}

	return &chatpb.ExportChatInviteResponse{InviteLink: "https://aerogram.app/join/" + invite.InviteCode}, nil
}

func (s *Server) JoinChatByInvite(ctx context.Context, req *chatpb.JoinChatByInviteRequest) (*chatpb.JoinChatByInviteResponse, error) {
	userID := s.getUserID(ctx, "")
	uUUID, _ := uuid.Parse(userID)

	invite, err := s.db.Queries.GetInviteByCode(ctx, req.InviteCode)
	if err != nil {
		return nil, status.Error(codes.NotFound, "invalid invite")
	}

	if _, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: invite.DialogID, UserID: uUUID}); err == nil {
		return &chatpb.JoinChatByInviteResponse{ChatId: invite.DialogID.String(), Success: true}, nil
	}

	err = s.db.Queries.JoinDialogByInvite(ctx, dbgen.JoinDialogByInviteParams{
		DialogID: invite.DialogID, UserID: uUUID, Role: "member", InviteID: uuid.NullUUID{UUID: invite.ID, Valid: true},
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to join")
	}

	_ = s.db.Queries.IncrementInviteUsage(ctx, invite.ID)
	_ = s.db.Queries.IncrementMembersCount(ctx, invite.DialogID)

	s.rdb.Publish(ctx, "user_chats:"+userID, "{}")
	return &chatpb.JoinChatByInviteResponse{ChatId: invite.DialogID.String(), Success: true}, nil
}

func (s *Server) DeleteChat(ctx context.Context, req *chatpb.DeleteChatRequest) (*chatpb.DeleteChatResponse, error) {
	uid, _ := uuid.Parse(s.getUserID(ctx, req.UserId))
	did, _ := uuid.Parse(helpers.ToRawID(req.ChatId))

	dialog, _ := s.dialogRepo.GetDialogByID(ctx, did.String())
	member, _ := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: did, UserID: uid})

	if req.ForEveryone {
		if dialog.Type == "private" || member.Role == "owner" {
			_ = s.db.Queries.DeleteDialog(ctx, did)
			s.rdb.Publish(ctx, "chat_deleted:"+req.ChatId, "{}")
			return &chatpb.DeleteChatResponse{Success: true}, nil
		}
		return nil, status.Error(codes.PermissionDenied, "owner only")
	}

	_ = s.db.Queries.HideDialogMember(ctx, dbgen.HideDialogMemberParams{DialogID: did, UserID: uid})
	return &chatpb.DeleteChatResponse{Success: true}, nil
}

func (s *Server) RemoveChatMember(ctx context.Context, req *chatpb.RemoveChatMemberRequest) (*chatpb.RemoveChatMemberResponse, error) {
	auid, _ := uuid.Parse(s.getUserID(ctx, ""))
	did, _ := uuid.Parse(helpers.ToRawID(req.ChatId))
	tuid, _ := uuid.Parse(helpers.ToRawID(req.UserId))

	if auid == tuid {
		return nil, status.Error(codes.InvalidArgument, "use LeaveChat")
	}

	reqm, _ := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: did, UserID: auid})
	if reqm.Role != "owner" && reqm.Role != "admin" {
		return nil, status.Error(codes.PermissionDenied, "insufficient perms")
	}

	targ, _ := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: did, UserID: tuid})
	if targ.Role == "owner" || (targ.Role == "admin" && reqm.Role != "owner") {
		return nil, status.Error(codes.PermissionDenied, "hierarchy violation")
	}

	_ = s.db.Queries.RemoveDialogMember(ctx, dbgen.RemoveDialogMemberParams{DialogID: did, UserID: tuid})
	_ = s.db.Queries.DecrementMembersCount(ctx, did)
	s.rdb.Publish(ctx, "user_chats_kicked:"+helpers.ToRawID(req.UserId), req.ChatId)

	return &chatpb.RemoveChatMemberResponse{Success: true}, nil
}

func (s *Server) UpdateMemberRole(ctx context.Context, req *chatpb.UpdateMemberRoleRequest) (*chatpb.UpdateMemberRoleResponse, error) {
	auid, _ := uuid.Parse(s.getUserID(ctx, ""))
	did, _ := uuid.Parse(helpers.ToRawID(req.ChatId))
	tuid, _ := uuid.Parse(helpers.ToRawID(req.TargetUserId))

	admin, _ := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: did, UserID: auid})
	if admin.Role != "owner" {
		return nil, status.Error(codes.PermissionDenied, "owner only")
	}

	if req.NewRole == "admin" {
		cnt, _ := s.db.Queries.CountDialogAdmins(ctx, did)
		if cnt >= MaxAdminsLimit {
			return nil, status.Error(codes.ResourceExhausted, "admin limit")
		}
	}

	if req.NewRole == "owner" {
		_ = s.db.Queries.UpdateDialogMemberRole(ctx, dbgen.UpdateDialogMemberRoleParams{DialogID: did, UserID: tuid, Role: "owner"})
		_ = s.db.Queries.UpdateDialogMemberRole(ctx, dbgen.UpdateDialogMemberRoleParams{DialogID: did, UserID: auid, Role: "admin"})
		_ = s.db.Queries.UpdateDialogCreator(ctx, dbgen.UpdateDialogCreatorParams{ID: did, CreatorID: uuid.NullUUID{UUID: tuid, Valid: true}})
	} else {
		_ = s.db.Queries.UpdateDialogMemberRole(ctx, dbgen.UpdateDialogMemberRoleParams{DialogID: did, UserID: tuid, Role: req.NewRole})
	}

	return &chatpb.UpdateMemberRoleResponse{Success: true}, nil
}
