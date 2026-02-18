package chat_svc

import (
	"context"

	chatpb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/chat/v1"
	"github.com/aerogram-org/aerogram-api/internal/models"
	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gorm.io/gorm"
)

type Server struct {
	chatpb.UnimplementedChatServiceServer
	db *gorm.DB
}

func NewServer(db *gorm.DB) *Server {
	return &Server{db: db}
}

func (s *Server) CreateChat(ctx context.Context, req *chatpb.CreateChatRequest) (*chatpb.CreateChatResponse, error) {
	if req.Type == chatpb.ChatType_CHAT_TYPE_PRIVATE {
		var existingID string
		s.db.Raw(`
			SELECT dm.dialog_id
			FROM dialog_members dm
			JOIN dialogs d ON d.id = dm.dialog_id
			WHERE dm.user_id IN (?)
			  AND d.type = 'private'
			  AND d.deleted_at IS NULL
			GROUP BY dm.dialog_id
			HAVING COUNT(DISTINCT dm.user_id) = 2
		`, req.ParticipantIds).Scan(&existingID)

		if existingID != "" {
			var dialog models.Dialog
			if err := s.db.First(&dialog, "id = ?", existingID).Error; err == nil {
				return &chatpb.CreateChatResponse{
					Chat: s.mapDialogToProto(&dialog),
				}, nil
			}
		}
	}

	dialog := models.Dialog{
		ID:           uuid.NewString(),
		Type:         s.mapProtoTypeToModel(req.Type),
		Name:         req.Title,
		Username:     req.Slug,
		CreatorID:    &req.CreatorId,
		MembersCount: len(req.ParticipantIds),
		IsActive:     true,
	}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&dialog).Error; err != nil {
			return err
		}

		for _, userID := range req.ParticipantIds {
			role := models.RoleMember
			if userID == req.CreatorId {
				role = models.RoleOwner
			}

			member := models.DialogMember{
				DialogID: dialog.ID,
				UserID:   userID,
				Role:     role,
			}

			if err := tx.Create(&member).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &chatpb.CreateChatResponse{
		Chat: s.mapDialogToProto(&dialog),
	}, nil
}

func (s *Server) GetMyChats(ctx context.Context, req *chatpb.GetMyChatsRequest) (*chatpb.GetMyChatsResponse, error) {
	var dialogs []models.Dialog

	err := s.db.
		Table("dialogs").
		Joins("JOIN dialog_members ON dialog_members.dialog_id = dialogs.id").
		Where("dialog_members.user_id = ? AND dialogs.deleted_at IS NULL", req.UserId).
		Order("dialogs.last_message_at DESC").
		Find(&dialogs).Error

	if err != nil {
		return nil, err
	}

	res := make([]*chatpb.Chat, 0, len(dialogs))
	for i := range dialogs {
		res = append(res, s.mapDialogToProto(&dialogs[i]))
	}

	return &chatpb.GetMyChatsResponse{Chats: res}, nil
}

func (s *Server) GetChat(ctx context.Context, req *chatpb.GetChatRequest) (*chatpb.GetChatResponse, error) {
	var dialog models.Dialog

	q := s.db.Model(&models.Dialog{})

	if req.ChatId != nil {
		q = q.Where("id = ?", *req.ChatId)
	} else if req.Slug != nil {
		q = q.Where("username = ?", *req.Slug)
	} else {
		return nil, status.Error(codes.InvalidArgument, "chat_id or slug required")
	}

	if err := q.First(&dialog).Error; err != nil {
		return nil, status.Error(codes.NotFound, "chat not found")
	}

	var count int64
	s.db.Model(&models.DialogMember{}).
		Where("dialog_id = ? AND user_id = ?", dialog.ID, req.UserId).
		Count(&count)

	if count == 0 {
		return nil, status.Error(codes.PermissionDenied, "forbidden")
	}

	return &chatpb.GetChatResponse{
		Chat: s.mapDialogToProto(&dialog),
	}, nil
}

func (s *Server) PinChat(ctx context.Context, req *chatpb.PinChatRequest) (*chatpb.PinChatResponse, error) {
	err := s.db.Model(&models.DialogMember{}).
		Where("dialog_id = ? AND user_id = ?", req.ChatId, req.UserId).
		Update("is_pinned", req.Pinned).Error

	if err != nil {
		return nil, err
	}

	return &chatpb.PinChatResponse{Success: true}, nil
}

func (s *Server) mapProtoTypeToModel(t chatpb.ChatType) models.DialogType {
	switch t {
	case chatpb.ChatType_CHAT_TYPE_GROUP:
		return models.Group
	case chatpb.ChatType_CHAT_TYPE_CHANNEL:
		return models.Channel
	default:
		return models.Private
	}
}

func (s *Server) mapDialogToProto(d *models.Dialog) *chatpb.Chat {
	title := ""
	slug := ""
	lastMsgID := ""

	if d.Name != nil {
		title = *d.Name
	}
	if d.Username != nil {
		slug = *d.Username
	}
	if d.LastMessageID != nil {
		lastMsgID = *d.LastMessageID
	}

	var t chatpb.ChatType
	switch d.Type {
	case models.Group:
		t = chatpb.ChatType_CHAT_TYPE_GROUP
	case models.Channel:
		t = chatpb.ChatType_CHAT_TYPE_CHANNEL
	default:
		t = chatpb.ChatType_CHAT_TYPE_PRIVATE
	}

	return &chatpb.Chat{
		Id:            d.ID,
		Type:          t,
		Title:         title,
		Slug:          slug,
		MembersCount:  int32(d.MembersCount),
		LastMessageId: lastMsgID,
	}
}
