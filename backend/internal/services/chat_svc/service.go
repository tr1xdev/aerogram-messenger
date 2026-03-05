package chat_svc

import (
	"context"

	"github.com/google/uuid"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	chatpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/chat/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/repositories"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type Server struct {
	chatpb.UnimplementedChatServiceServer
	db         *database.DB
	dialogRepo *repositories.DialogRepository
}

func NewServer(db *database.DB) *Server {
	return &Server{
		db:         db,
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

func (s *Server) CreateChat(ctx context.Context, req *chatpb.CreateChatRequest) (*chatpb.CreateChatResponse, error) {
	creatorIDStr := s.getUserID(ctx, req.CreatorId)
	if creatorIDStr == "" {
		return nil, status.Error(codes.Unauthenticated, "unauthorized access")
	}

	newID := uuid.New()

	dParams := dbgen.CreateDialogParams{
		ID:           newID,
		Type:         s.mapProtoTypeToDB(req.Type),
		Name:         database.ToNullString(req.Title),
		Username:     database.ToNullString(req.Slug),
		CreatorID:    database.ToNullUUID(creatorIDStr),
		MembersCount: int32(len(req.ParticipantIds)),
		IsActive:     true,
	}

	mParams := make([]dbgen.AddDialogMemberParams, len(req.ParticipantIds))
	for i, pID := range req.ParticipantIds {
		uid, err := uuid.Parse(pID)
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid participant id")
		}

		role := "member"
		if pID == creatorIDStr {
			role = "owner"
		}

		mParams[i] = dbgen.AddDialogMemberParams{
			DialogID:        newID,
			UserID:          uid,
			Role:            role,
			NotificationsOn: true,
		}
	}

	sParams := dbgen.CreateDialogSettingsParams{
		DialogID:            newID,
		Permissions:         0,
		SlowModeDelay:       0,
		IsHistoryHidden:     false,
		IsSignaturesEnabled: false,
	}

	err := s.dialogRepo.CreateDialog(ctx, dParams, mParams, sParams)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to create chat")
	}

	dialog, err := s.dialogRepo.GetDialogByID(ctx, newID.String())
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to fetch created chat")
	}

	return &chatpb.CreateChatResponse{
		Chat: s.mapDBDialogToProto(dialog),
	}, nil
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
		res = append(res, s.mapDBDialogToProto(d))
	}

	return &chatpb.GetMyChatsResponse{Chats: res}, nil
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

func (s *Server) GetChat(ctx context.Context, req *chatpb.GetChatRequest) (*chatpb.GetChatResponse, error) {
	var dialog dbgen.Dialog
	var err error

	if req.ChatId != nil && *req.ChatId != "" {
		dialog, err = s.dialogRepo.GetDialogByID(ctx, *req.ChatId)
	} else if req.Slug != nil && *req.Slug != "" {
		dialog, err = s.dialogRepo.GetDialogByUsername(ctx, *req.Slug)
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

func (s *Server) mapDBDialogToProto(d dbgen.Dialog) *chatpb.Chat {
	res := &chatpb.Chat{
		Id:           d.ID.String(),
		MembersCount: int32(d.MembersCount),
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
		res.Type = chatpb.ChatType_CHAT_TYPE_GROUP
	case "channel":
		res.Type = chatpb.ChatType_CHAT_TYPE_CHANNEL
	default:
		res.Type = chatpb.ChatType_CHAT_TYPE_PRIVATE
	}

	return res
}
