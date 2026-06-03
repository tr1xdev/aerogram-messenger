package chat_svc

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
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
	PermSendMessages int32 = 1
	PermSendMedia    int32 = 2
	PermAddMembers   int32 = 4
	PermPinMessages  int32 = 8
	PermChangeInfo   int32 = 16
)

const MaxAdminsLimit int = 50

// TODO: move to config
const getChatRateLimit = 60
const getChatRateWindow = time.Minute

type Server struct {
	chatpb.UnimplementedChatServiceServer
	db         *database.DB
	rdb        *redis.Client
	dialogRepo *repositories.DialogRepository
	userRepo   *repositories.UserRepository
	limiter    limiter.RateLimiter
	cfg        config.ChatLimitConfig
}

func NewServer(db *database.DB, rdb *redis.Client, l limiter.RateLimiter, cfg config.ChatLimitConfig) *Server {
	return &Server{
		db:         db,
		rdb:        rdb,
		dialogRepo: repositories.NewDialogRepository(db),
		userRepo:   repositories.NewUserRepository(db),
		limiter:    l,
		cfg:        cfg,
	}
}

func (s *Server) getAuthID(ctx context.Context) (uuid.UUID, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return uuid.Nil, status.Error(codes.Unauthenticated, "metadata missing")
	}
	ids := md.Get("user-id")
	if len(ids) == 0 {
		return uuid.Nil, status.Error(codes.Unauthenticated, "user-id missing")
	}
	uid, err := uuid.Parse(helpers.ToRawID(ids[0]))
	if err != nil {
		return uuid.Nil, status.Error(codes.Unauthenticated, "invalid user-id format")
	}
	return uid, nil
}

func (s *Server) checkPermission(ctx context.Context, dialogID uuid.UUID, userID uuid.UUID, bit int32) (bool, error) {
	dialog, err := s.db.Queries.GetDialogByID(ctx, dbgen.GetDialogByIDParams{
		ID:     dialogID,
		UserID: userID,
	})
	if err != nil {
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
		return false, status.Error(codes.PermissionDenied, "not a member")
	}

	if member.Role == "owner" || member.Role == "admin" {
		return true, nil
	}

	if dialog.Type == "channel" {
		return false, status.Error(codes.PermissionDenied, "only admins can perform this action in channels")
	}

	settings, err := s.db.Queries.GetDialogSettings(ctx, dialogID)
	if err != nil {
		return true, nil
	}

	if (settings.Permissions & int64(bit)) != 0 {
		return false, status.Error(codes.PermissionDenied, "action restricted by chat settings")
	}

	return true, nil
}

func (s *Server) CreateChat(ctx context.Context, req *chatpb.CreateChatRequest) (*chatpb.CreateChatResponse, error) {
	creatorID, err := s.getAuthID(ctx)
	if err != nil {
		return nil, err
	}

	if err := s.limiter.Check(ctx, fmt.Sprintf("chat:create:%s", creatorID), s.cfg.Create.Limit, s.cfg.Create.Window); err != nil {
		return nil, status.Error(codes.ResourceExhausted, "too many requests")
	}

	if req.Type == chatpb.ChatType_CHAT_TYPE_PRIVATE {
		if len(req.ParticipantIds) != 2 {
			return nil, status.Error(codes.InvalidArgument, "private chat requires exactly 2 participants")
		}

		p1Raw, p2Raw := helpers.ToRawID(req.ParticipantIds[0]), helpers.ToRawID(req.ParticipantIds[1])

		if _, err := uuid.Parse(p1Raw); err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid participant id 1: %s", p1Raw)
		}
		if _, err := uuid.Parse(p2Raw); err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid participant id 2: %s", p2Raw)
		}

		if p1Raw == p2Raw {
			if p1Raw != creatorID.String() {
				return nil, status.Error(codes.InvalidArgument, "cannot create a private chat between another user and themselves")
			}

			if diag, err := s.dialogRepo.GetSavedMessagesDialog(ctx, p1Raw); err == nil {
				proto := s.mapDBDialogToProto(diag, 0, "owner", 0)
				proto.CanWrite = true
				proto.Permissions = s.calculatePermissions(diag.Type, 0, "owner")
				return &chatpb.CreateChatResponse{Chat: proto}, nil
			}
		} else {
			if diag, err := s.dialogRepo.GetPrivateDialogByMembers(ctx, p1Raw, p2Raw); err == nil {
				proto := s.mapDBDialogToProto(diag, 0, "member", 0)
				return &chatpb.CreateChatResponse{Chat: proto}, nil
			}
		}
	}

	newID := uuid.New()
	participants := make(map[uuid.UUID]bool)
	participants[creatorID] = true

	for _, pid := range req.ParticipantIds {
		rawID := helpers.ToRawID(pid)
		pUUID, err := uuid.Parse(rawID)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid participant id structure: %s", rawID)
		}
		participants[pUUID] = true
	}

	dParams := dbgen.CreateDialogParams{
		ID:           newID,
		Type:         s.mapProtoTypeToDB(req.Type),
		Name:         database.ToNullString(req.Title),
		Username:     database.ToNullString(req.Slug),
		CreatorID:    uuid.NullUUID{UUID: creatorID, Valid: true},
		MembersCount: int32(len(participants)),
		IsActive:     true,
	}

	mParams := make([]dbgen.AddDialogMemberParams, 0, len(participants))
	for pUUID := range participants {
		role := "member"
		if pUUID == creatorID {
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
		defaultPerms = int64(PermSendMessages | PermSendMedia | PermAddMembers | PermPinMessages | PermChangeInfo)
	}

	err = s.dialogRepo.CreateDialog(ctx, dParams, mParams, dbgen.CreateDialogSettingsParams{
		DialogID:    newID,
		Permissions: defaultPerms,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to execute database transaction")
	}

	dialog, err := s.dialogRepo.GetDialogByID(ctx, newID.String(), creatorID)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to retrieve newly created chat metadata")
	}

	creatorRole := "member"
	if participants[creatorID] {
		creatorRole = "owner"
	}

	proto := s.mapDBDialogToProto(dialog, defaultPerms, creatorRole, 0)
	proto.CanWrite = true
	proto.Permissions = s.calculatePermissions(dialog.Type, defaultPerms, creatorRole)

	payload, err := json.Marshal(proto)
	if err == nil {
		for pUUID := range participants {
			s.rdb.Publish(ctx, fmt.Sprintf("user_chats:%s", pUUID), payload)
		}
	}

	return &chatpb.CreateChatResponse{Chat: proto}, nil
}

func (s *Server) GetChatMembers(ctx context.Context, req *chatpb.GetChatMembersRequest) (*chatpb.GetChatMembersResponse, error) {
	authID, err := s.getAuthID(ctx)
	if err != nil {
		return nil, err
	}

	did, err := uuid.Parse(helpers.ToRawID(req.ChatId))
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}

	_, err = s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
		DialogID: did,
		UserID:   authID,
	})
	if err != nil {
		return nil, status.Error(codes.PermissionDenied, "access denied")
	}

	members, err := s.db.Queries.GetDialogMembers(ctx, did)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to fetch members")
	}

	res := make([]*chatpb.ChatMember, 0, len(members))
	for _, m := range members {
		res = append(res, &chatpb.ChatMember{
			UserId: m.UserID.String(),
			Role:   m.Role,
		})
	}

	return &chatpb.GetChatMembersResponse{
		Members: res,
	}, nil
}

func (s *Server) UpdateMemberRole(ctx context.Context, req *chatpb.UpdateMemberRoleRequest) (*chatpb.UpdateMemberRoleResponse, error) {
	authID, err := s.getAuthID(ctx)
	if err != nil {
		return nil, err
	}

	did, err := uuid.Parse(helpers.ToRawID(req.ChatId))
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}

	targetUID, err := uuid.Parse(req.TargetUserId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid user id")
	}

	caller, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
		DialogID: did,
		UserID:   authID,
	})
	if err != nil || caller.Role != "owner" {
		return nil, status.Error(codes.PermissionDenied, "access denied")
	}

	err = s.db.Queries.UpdateDialogMemberRole(ctx, dbgen.UpdateDialogMemberRoleParams{
		DialogID: did,
		UserID:   targetUID,
		Role:     req.NewRole,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "db error")
	}

	return &chatpb.UpdateMemberRoleResponse{Success: true}, nil
}

func (s *Server) RemoveChatMember(ctx context.Context, req *chatpb.RemoveChatMemberRequest) (*chatpb.RemoveChatMemberResponse, error) {
	authID, err := s.getAuthID(ctx)
	if err != nil {
		return nil, err
	}

	did, err := uuid.Parse(helpers.ToRawID(req.ChatId))
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}

	targetUID, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid user id")
	}

	caller, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
		DialogID: did,
		UserID:   authID,
	})
	if err != nil || (caller.Role != "owner" && caller.Role != "admin") {
		return nil, status.Error(codes.PermissionDenied, "access denied")
	}

	txErr := s.db.WithTx(ctx, func(q *dbgen.Queries) error {
		err = q.RemoveDialogMember(ctx, dbgen.RemoveDialogMemberParams{
			DialogID: did,
			UserID:   targetUID,
		})
		if err != nil {
			return err
		}

		return q.DecrementMembersCount(ctx, did)
	})

	if txErr != nil {
		return nil, status.Error(codes.Internal, "failed to remove member")
	}

	return &chatpb.RemoveChatMemberResponse{Success: true}, nil
}

func (s *Server) LeaveChat(ctx context.Context, req *chatpb.LeaveChatRequest) (*chatpb.LeaveChatResponse, error) {
	authID, err := s.getAuthID(ctx)
	if err != nil {
		return nil, err
	}

	did, err := uuid.Parse(helpers.ToRawID(req.ChatId))
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}

	member, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
		DialogID: did,
		UserID:   authID,
	})
	if err != nil {
		return nil, status.Error(codes.NotFound, "not a member")
	}

	txErr := s.db.WithTx(ctx, func(q *dbgen.Queries) error {
		if err := q.RemoveDialogMember(ctx, dbgen.RemoveDialogMemberParams{DialogID: did, UserID: authID}); err != nil {
			return err
		}

		if err := q.DecrementMembersCount(ctx, did); err != nil {
			return err
		}

		dialog, err := q.GetDialogByIDInternal(ctx, did)
		if err != nil {
			return err
		}

		if dialog.MembersCount <= 0 {
			return q.DeleteDialog(ctx, did)
		}

		if member.Role == "owner" {
			heir, err := q.FindNewDialogOwner(ctx, dbgen.FindNewDialogOwnerParams{DialogID: did, UserID: authID})
			if err == nil {
				_ = q.UpdateDialogMemberRole(ctx, dbgen.UpdateDialogMemberRoleParams{DialogID: did, UserID: heir, Role: "owner"})
				_ = q.UpdateDialogCreator(ctx, dbgen.UpdateDialogCreatorParams{ID: did, CreatorID: uuid.NullUUID{UUID: heir, Valid: true}})
			}
		}

		return nil
	})

	if txErr != nil {
		return nil, status.Error(codes.Internal, "leave operation failed")
	}

	s.rdb.Publish(ctx, fmt.Sprintf("user_chats_leave:%s", authID), req.ChatId)
	return &chatpb.LeaveChatResponse{Success: true}, nil
}

func (s *Server) GetChat(ctx context.Context, req *chatpb.GetChatRequest) (*chatpb.GetChatResponse, error) {
	authID, _ := s.getAuthID(ctx)

	limitKey := fmt.Sprintf("limiter:get_chat:%s", authID)
	if authID == uuid.Nil {
		limitKey = "limiter:get_chat:guest"
	}

	if err := s.limiter.Check(ctx, limitKey, getChatRateLimit, getChatRateWindow); err != nil {
		return nil, status.Error(codes.ResourceExhausted, "request limit exceeded, please try again later")
	}

	var dialog dbgen.Dialog
	var err error

	if req.ChatId != nil && *req.ChatId != "" {
		rawID := helpers.ToRawID(*req.ChatId)
		parsedID, pErr := uuid.Parse(rawID)
		if pErr != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid uuid: %v", pErr)
		}

		dialog, err = s.db.Queries.GetDialogByID(ctx, dbgen.GetDialogByIDParams{
			ID:     parsedID,
			UserID: authID,
		})
	} else if req.Slug != nil && *req.Slug != "" {
		slug := strings.TrimPrefix(*req.Slug, "@")

		dialog, err = s.db.Queries.GetDialogByUsername(ctx, sql.NullString{
			String: slug,
			Valid:  true,
		})

		if err != nil {
			invite, invErr := s.db.Queries.GetInviteByCode(ctx, slug)
			if invErr == nil {
				dialog, err = s.db.Queries.GetDialogByID(ctx, dbgen.GetDialogByIDParams{
					ID:     invite.DialogID,
					UserID: authID,
				})

				if errors.Is(err, sql.ErrNoRows) {
					dialog, err = s.db.Queries.GetDialogByIDInternal(ctx, invite.DialogID)
				}
			}
		}

		if err != nil && authID != uuid.Nil {
			if target, uErr := s.userRepo.GetByUsername(ctx, slug); uErr == nil {
				if existing, diagErr := s.dialogRepo.GetPrivateDialogByMembers(ctx, authID.String(), target.ID.String()); diagErr == nil {
					dialog = existing
					err = nil
				}
			}
		}
	} else {
		return nil, status.Error(codes.InvalidArgument, "id or slug required")
	}

	if err != nil {
		return nil, status.Error(codes.NotFound, "chat not found")
	}

	role, lastRead, perms := "guest", int64(0), int64(0)
	if authID != uuid.Nil {
		m, mErr := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
			DialogID: dialog.ID,
			UserID:   authID,
		})
		if mErr == nil {
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
	authID, err := s.getAuthID(ctx)
	if err != nil {
		return nil, err
	}

	rows, err := s.dialogRepo.GetUserDialogs(ctx, authID.String())
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to fetch user chats")
	}

	res := make([]*chatpb.Chat, 0, len(rows))
	for _, r := range rows {
		var perms int64 = 0
		if set, sErr := s.db.Queries.GetDialogSettings(ctx, r.ID); sErr == nil {
			perms = set.Permissions
		}

		proto := s.mapGetUserDialogsRowToProto(r)
		proto.CanWrite = s.calculateCanWrite(r.Type, perms, r.Role, r.IsActive)
		proto.Permissions = s.calculatePermissions(r.Type, perms, r.Role)
		res = append(res, proto)
	}

	return &chatpb.GetMyChatsResponse{Chats: res}, nil
}

func (s *Server) UpdateChat(ctx context.Context, req *chatpb.UpdateChatRequest) (*chatpb.UpdateChatResponse, error) {
	authID, err := s.getAuthID(ctx)
	if err != nil {
		return nil, err
	}
	did, err := uuid.Parse(helpers.ToRawID(req.ChatId))
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}

	log.Printf("[UPDATE-CHAT] Request: ID=%s, Title=%v, Slug=%v", did, req.Title, req.Slug)

	ok, err := s.checkPermission(ctx, did, authID, PermChangeInfo)
	if err != nil || !ok {
		log.Printf("[UPDATE-CHAT] Permission denied for user %s in chat %s", authID, did)
		return nil, status.Error(codes.PermissionDenied, "forbidden")
	}

	var newSlug sql.NullString
	shouldUpdateSlug := false

	if req.Slug != nil {
		shouldUpdateSlug = true
		clean := strings.TrimSpace(strings.TrimPrefix(*req.Slug, "@"))
		log.Printf("[UPDATE-CHAT] Processing slug: Input=%s, Clean=%s", *req.Slug, clean)
		if clean != "" {
			newSlug = sql.NullString{String: clean, Valid: true}
		} else {
			newSlug = sql.NullString{Valid: false}
		}
	}

	log.Printf("[UPDATE-CHAT] Params for DB: UpdateSlug=%t, SlugValue=%s, SlugValid=%t", shouldUpdateSlug, newSlug.String, newSlug.Valid)

	updated, err := s.db.Queries.UpdateChatMetadata(ctx, dbgen.UpdateChatMetadataParams{
		ID:          did,
		Name:        database.ToNullString(req.Title),
		UpdateSlug:  shouldUpdateSlug,
		Username:    newSlug,
		Description: database.ToNullString(req.Description),
		PhotoUrl:    database.ToNullString(req.PhotoUrl),
	})

	if err != nil {
		log.Printf("[UPDATE-CHAT] DB Error: %v", err)
		if strings.Contains(err.Error(), "unique constraint") {
			return nil, status.Error(codes.AlreadyExists, "username already taken")
		}
		return nil, status.Error(codes.Internal, "update failed")
	}

	log.Printf("[UPDATE-CHAT] Successfully updated. New DB Slug: %s (Valid: %t)", updated.Username.String, updated.Username.Valid)

	proto := s.mapDBDialogToProto(updated, 0, "admin", 0)
	payload, _ := json.Marshal(map[string]interface{}{"event": "CHAT_UPDATED", "chat": proto})
	s.rdb.Publish(ctx, fmt.Sprintf("chat_updates:%s", did), payload)

	return &chatpb.UpdateChatResponse{Chat: proto}, nil
}

func (s *Server) JoinChatByInvite(ctx context.Context, req *chatpb.JoinChatByInviteRequest) (*chatpb.JoinChatByInviteResponse, error) {
	authID, err := s.getAuthID(ctx)
	if err != nil {
		return nil, err
	}

	if req.InviteCode == "" {
		return nil, status.Error(codes.InvalidArgument, "invite code is required")
	}

	invite, err := s.db.Queries.GetInviteByCode(ctx, req.InviteCode)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, status.Error(codes.NotFound, "invite link not found")
		}
		return nil, status.Error(codes.Internal, "verification failed")
	}

	if invite.IsRevoked {
		return nil, status.Error(codes.PermissionDenied, "this invite link has been revoked")
	}

	if invite.ExpireAt.Valid && time.Now().After(invite.ExpireAt.Time) {
		return nil, status.Error(codes.DeadlineExceeded, "this invite link has expired")
	}

	if invite.UsageLimit.Valid && invite.UsageCount >= invite.UsageLimit.Int32 {
		return nil, status.Error(codes.ResourceExhausted, "this invite link has reached its usage limit")
	}

	var chatID uuid.UUID
	txErr := s.db.WithTx(ctx, func(q *dbgen.Queries) error {
		chatID = invite.DialogID

		existing, err := q.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
			DialogID: chatID,
			UserID:   authID,
		})

		isNewMember := false
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				isNewMember = true
			} else {
				return err
			}
		}

		if !isNewMember && !existing.IsHidden {
			return nil
		}

		err = q.JoinDialogByInvite(ctx, dbgen.JoinDialogByInviteParams{
			DialogID: chatID,
			UserID:   authID,
			Role:     "member",
			InviteID: uuid.NullUUID{UUID: invite.ID, Valid: true},
		})
		if err != nil {
			return err
		}

		if isNewMember {
			err = q.IncrementMembersCount(ctx, chatID)
			if err != nil {
				return err
			}

			err = q.IncrementInviteUsage(ctx, invite.ID)
			if err != nil {
				return err
			}
		}

		return nil
	})

	if txErr != nil {
		return nil, status.Error(codes.Internal, "failed to join chat")
	}

	payload, _ := json.Marshal(map[string]interface{}{
		"event":   "USER_JOINED",
		"chat_id": chatID,
		"user_id": authID,
	})
	s.rdb.Publish(ctx, fmt.Sprintf("chat_updates:%s", chatID), payload)

	return &chatpb.JoinChatByInviteResponse{
		ChatId:  helpers.EncodeGlobalID("Chat", chatID.String()),
		Success: true,
	}, nil
}

func (s *Server) calculatePermissions(chatType string, perms int64, role string) *chatpb.ChatPermissions {
	lowerRole := strings.ToLower(role)
	isAdmin := lowerRole == "owner" || lowerRole == "admin"

	if chatType == "private" {
		return &chatpb.ChatPermissions{CanSendMessage: true, CanDeleteMessages: true}
	}

	check := func(bit int32) bool { return isAdmin || (perms&int64(bit)) == 0 }

	return &chatpb.ChatPermissions{
		CanSendMessage:    check(PermSendMessages),
		CanInviteUsers:    check(PermAddMembers),
		CanEditMetadata:   isAdmin,
		CanDeleteMessages: isAdmin,
		CanAssignAdmins:   lowerRole == "owner",
		CanSendMedia:      check(PermSendMedia),
		CanPinMessages:    check(PermPinMessages),
	}
}

func (s *Server) calculateCanWrite(chatType string, permissions int64, role string, isActive bool) bool {
	lowerRole := strings.ToLower(role)

	if lowerRole == "owner" || lowerRole == "admin" {
		return true
	}

	if !isActive {
		return false
	}

	if chatType == "channel" || lowerRole == "guest" {
		return false
	}

	return (permissions & int64(PermSendMessages)) == 0
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
		IsActive: row.IsActive,
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

func (s *Server) PinChat(ctx context.Context, req *chatpb.PinChatRequest) (*chatpb.PinChatResponse, error) {
	authID, err := s.getAuthID(ctx)
	if err != nil {
		return nil, err
	}

	did, err := uuid.Parse(helpers.ToRawID(req.ChatId))
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}

	err = s.db.Queries.PinDialog(ctx, dbgen.PinDialogParams{
		DialogID: did,
		UserID:   authID,
		IsPinned: req.Pinned,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to pin chat")
	}

	return &chatpb.PinChatResponse{Success: true}, nil
}

func (s *Server) DeleteChat(ctx context.Context, req *chatpb.DeleteChatRequest) (*chatpb.DeleteChatResponse, error) {
	authID, err := s.getAuthID(ctx)
	if err != nil {
		return nil, err
	}

	did, err := uuid.Parse(helpers.ToRawID(req.ChatId))
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}

	chat, err := s.db.Queries.GetDialogByIDInternal(ctx, did)
	if err != nil {
		return nil, status.Error(codes.NotFound, "chat not found")
	}

	if req.ForEveryone {
		var canDelete bool
		if chat.Type == "private" {
			canDelete, err = s.db.Queries.CanDeletePrivateDialog(ctx, dbgen.CanDeletePrivateDialogParams{
				ID:     did,
				UserID: authID,
			})
		} else {
			canDelete, err = s.db.Queries.IsDialogCreator(ctx, dbgen.IsDialogCreatorParams{
				ID:        did,
				CreatorID: uuid.NullUUID{UUID: authID, Valid: true},
			})
		}

		if err != nil || !canDelete {
			return nil, status.Error(codes.PermissionDenied, "access denied")
		}

		err = s.db.Queries.DeleteDialog(ctx, did)
		if err != nil {
			return nil, status.Error(codes.Internal, "failed to delete chat")
		}
	} else {
		err = s.db.Queries.HideDialogMember(ctx, dbgen.HideDialogMemberParams{
			DialogID: did,
			UserID:   authID,
		})
		if err != nil {
			return nil, status.Error(codes.Internal, "failed to hide chat")
		}
	}

	return &chatpb.DeleteChatResponse{Success: true}, nil
}

func (s *Server) InviteToChat(ctx context.Context, req *chatpb.InviteToChatRequest) (*chatpb.InviteToChatResponse, error) {
	authID, err := s.getAuthID(ctx)
	if err != nil {
		return nil, err
	}

	did, err := uuid.Parse(helpers.ToRawID(req.ChatId))
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}

	ok, err := s.checkPermission(ctx, did, authID, PermAddMembers)
	if err != nil || !ok {
		return nil, status.Error(codes.PermissionDenied, "forbidden")
	}

	for _, uidStr := range req.UserIds {
		uID, err := uuid.Parse(helpers.ToRawID(uidStr))
		if err != nil {
			continue
		}

		_ = s.db.Queries.AddDialogMember(ctx, dbgen.AddDialogMemberParams{
			DialogID:        did,
			UserID:          uID,
			Role:            "member",
			NotificationsOn: true,
		})
		_ = s.db.Queries.IncrementMembersCount(ctx, did)
	}

	return &chatpb.InviteToChatResponse{Success: true}, nil
}

func (s *Server) JoinChatBySlug(ctx context.Context, req *chatpb.JoinChatBySlugRequest) (*chatpb.JoinChatBySlugResponse, error) {
	authID, err := s.getAuthID(ctx)
	if err != nil {
		return nil, err
	}

	slug := strings.TrimPrefix(req.Slug, "@")
	dialog, err := s.db.Queries.GetDialogByUsername(ctx, sql.NullString{String: slug, Valid: true})
	if err != nil {
		return nil, status.Error(codes.NotFound, "chat not found")
	}

	if dialog.IsPrivate {
		return nil, status.Error(codes.PermissionDenied, "cannot join private chat by slug")
	}

	err = s.db.Queries.AddDialogMember(ctx, dbgen.AddDialogMemberParams{
		DialogID:        dialog.ID,
		UserID:          authID,
		Role:            "member",
		NotificationsOn: true,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to join")
	}

	_ = s.db.Queries.IncrementMembersCount(ctx, dialog.ID)

	return &chatpb.JoinChatBySlugResponse{
		ChatId:  helpers.EncodeGlobalID("Chat", dialog.ID.String()),
		Success: true,
	}, nil
}

func (s *Server) ExportChatInvite(ctx context.Context, req *chatpb.ExportChatInviteRequest) (*chatpb.ExportChatInviteResponse, error) {
	authID, err := s.getAuthID(ctx)
	if err != nil {
		return nil, err
	}

	did, err := uuid.Parse(helpers.ToRawID(req.ChatId))
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}

	member, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
		DialogID: did,
		UserID:   authID,
	})
	if err != nil {
		return nil, status.Error(codes.PermissionDenied, "not a member of this chat")
	}

	if member.Role != "owner" && member.Role != "admin" {
		return nil, status.Error(codes.PermissionDenied, "insufficient permissions")
	}

	err = s.db.Queries.RevokeAllDialogInvites(ctx, did)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to revoke old invites")
	}

	code := uuid.New().String()[:12]

	var expireAt sql.NullTime
	if req.ExpireAt != nil {
		expireAt = sql.NullTime{Time: time.Unix(*req.ExpireAt, 0), Valid: true}
	}

	var usageLimit sql.NullInt32
	if req.UsageLimit != nil {
		usageLimit = sql.NullInt32{Int32: *req.UsageLimit, Valid: true}
	}

	var inviteName sql.NullString
	if req.Name != nil {
		inviteName = sql.NullString{String: *req.Name, Valid: true}
	}

	_, err = s.db.Queries.CreateDialogInvite(ctx, dbgen.CreateDialogInviteParams{
		DialogID:   did,
		CreatorID:  authID,
		InviteCode: code,
		Name:       inviteName,
		UsageLimit: usageLimit,
		ExpireAt:   expireAt,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to create invite")
	}

	err = s.db.Queries.UpdateDialogInviteLink(ctx, dbgen.UpdateDialogInviteLinkParams{
		ID:         did,
		InviteLink: sql.NullString{String: code, Valid: true},
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update dialog link")
	}

	return &chatpb.ExportChatInviteResponse{
		InviteLink: fmt.Sprintf("/join/%s", code),
	}, nil
}

func (s *Server) UpdateChatPermissions(ctx context.Context, req *chatpb.UpdateChatPermissionsRequest) (*chatpb.UpdateChatPermissionsResponse, error) {
	authID, err := s.getAuthID(ctx)
	if err != nil {
		return nil, err
	}

	did, err := uuid.Parse(helpers.ToRawID(req.ChatId))
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}

	member, err := s.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{DialogID: did, UserID: authID})
	if err != nil || (member.Role != "owner" && member.Role != "admin") {
		return nil, status.Error(codes.PermissionDenied, "insufficient permissions")
	}

	var mask int64
	if !req.Permissions.CanSendMessage {
		mask |= int64(PermSendMessages)
	}
	if !req.Permissions.CanSendMedia {
		mask |= int64(PermSendMedia)
	}
	if !req.Permissions.CanInviteUsers {
		mask |= int64(PermAddMembers)
	}
	if !req.Permissions.CanPinMessages {
		mask |= int64(PermPinMessages)
	}
	if !req.Permissions.CanEditMetadata {
		mask |= int64(PermChangeInfo)
	}

	err = s.db.Queries.UpdateDialogSettings(ctx, dbgen.UpdateDialogSettingsParams{
		DialogID:    did,
		Permissions: mask,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to update settings")
	}

	return &chatpb.UpdateChatPermissionsResponse{Success: true}, nil
}

func (s *Server) RevokeChatInvite(ctx context.Context, req *chatpb.RevokeChatInviteRequest) (*chatpb.RevokeChatInviteResponse, error) {
	_, err := s.getAuthID(ctx)
	if err != nil {
		return nil, err
	}

	did, err := uuid.Parse(helpers.ToRawID(req.ChatId))
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid chat id")
	}

	err = s.db.Queries.RevokeInvite(ctx, dbgen.RevokeInviteParams{
		InviteCode: req.InviteCode,
		DialogID:   did,
	})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to revoke invite")
	}

	return &chatpb.RevokeChatInviteResponse{Success: true}, nil
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
