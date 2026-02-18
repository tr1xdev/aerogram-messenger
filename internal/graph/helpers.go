package graph

import (
	"context"

	"github.com/aerogram-org/aerogram-api/internal/graph/model"
	chatpb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/chat/v1"
	"github.com/aerogram-org/aerogram-api/internal/models"
)

func (r *Resolver) enrichChat(ctx context.Context, authID string, pbChat *chatpb.Chat) (*model.Chat, error) {
	chatType := model.ChatTypePrivate
	switch pbChat.Type {
	case chatpb.ChatType_CHAT_TYPE_GROUP:
		chatType = model.ChatTypeGroup
	case chatpb.ChatType_CHAT_TYPE_CHANNEL:
		chatType = model.ChatTypeChannel
	}

	var dbMembers []models.DialogMember
	r.db.WithContext(ctx).Where("dialog_id = ?", pbChat.Id).Find(&dbMembers)

	var userIDs []string
	var isPinned bool
	for _, m := range dbMembers {
		userIDs = append(userIDs, m.UserID)
		if m.UserID == authID {
			isPinned = m.IsPinned
		}
	}

	users, _ := r.userRepo.GetByIDs(userIDs)

	displayTitle := pbChat.Title
	if chatType == model.ChatTypePrivate {
		for _, u := range users {
			if u.ID != authID {
				displayTitle = u.FirstName
				if u.LastName != "" {
					displayTitle += " " + u.LastName
				}
				break
			}
		}
	}

	if displayTitle == "" {
		displayTitle = "Saved Messages"
	}

	var lastMsg *models.Message
	if pbChat.LastMessageId != "" {
		var msg models.Message
		if err := r.db.WithContext(ctx).First(&msg, "id = ?", pbChat.LastMessageId).Error; err == nil {
			lastMsg = &msg
		}
	}

	var unreadCount int64
	r.db.WithContext(ctx).Model(&models.Message{}).
		Where("dialog_id = ? AND author_id != ? AND created_at > (SELECT last_read_at FROM dialog_members WHERE dialog_id = ? AND user_id = ?)",
			pbChat.Id, authID, pbChat.Id, authID).
		Count(&unreadCount)

	return &model.Chat{
		ID:           pbChat.Id,
		Type:         chatType,
		Title:        displayTitle,
		Slug:         &pbChat.Slug,
		MembersCount: int(pbChat.MembersCount),
		Members:      users,
		LastMessage:  lastMsg,
		UnreadCount:  int(unreadCount),
		IsPinned:     isPinned,
	}, nil
}
