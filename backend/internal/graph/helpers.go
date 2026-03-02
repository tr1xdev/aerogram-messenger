package graph

import (
	"context"
	"errors"

	"github.com/aerogram-org/aerogram-api/internal/graph/model"
	chatpb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/chat/v1"
	"github.com/aerogram-org/aerogram-api/internal/models"
	"google.golang.org/grpc/status"
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

	idsMap := make(map[string]bool)
	var isPinned bool
	var myReadSeq int64
	var pReadSeq int64

	for _, m := range dbMembers {
		idsMap[m.UserID] = true
		if m.UserID == authID {
			isPinned = m.IsPinned
			myReadSeq = m.LastReadSequence
		} else {
			if chatType == model.ChatTypePrivate {
				pReadSeq = m.LastReadSequence
			} else if m.LastReadSequence > pReadSeq {
				pReadSeq = m.LastReadSequence
			}
		}
	}

	var lastMsg *models.Message
	if pbChat.LastMessageId != "" {
		var msg models.Message
		if err := r.db.WithContext(ctx).First(&msg, "id = ?", pbChat.LastMessageId).Error; err == nil {
			lastMsg = &msg
			idsMap[msg.AuthorID] = true
		}
	}

	userIDs := make([]string, 0, len(idsMap))
	for id := range idsMap {
		userIDs = append(userIDs, id)
	}

	users, _ := r.userRepo.GetByIDs(userIDs)
	userMap := make(map[string]*models.User)
	for _, u := range users {
		userMap[u.ID] = u
	}

	var gqlMembers []*model.ChatMember
	for _, m := range dbMembers {
		if u, ok := userMap[m.UserID]; ok {
			gqlMembers = append(gqlMembers, &model.ChatMember{
				User:             u,
				LastReadSequence: m.LastReadSequence,
			})
		}
	}

	if lastMsg != nil {
		lastMsg.Sender = userMap[lastMsg.AuthorID]
	}

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
		displayTitle = "Chat"
	}

	var unreadCount int64
	r.db.WithContext(ctx).Model(&models.Message{}).
		Where("dialog_id = ? AND author_id != ? AND sequence > ?", pbChat.Id, authID, myReadSeq).
		Count(&unreadCount)

	return &model.Chat{
		ID:               pbChat.Id,
		Type:             chatType,
		Title:            displayTitle,
		Slug:             &pbChat.Slug,
		MembersCount:     int(pbChat.MembersCount),
		Members:          gqlMembers,
		LastMessage:      lastMsg,
		UnreadCount:      int(unreadCount),
		IsPinned:         isPinned,
		LastReadSequence: pReadSeq,
		Messages:         []*models.Message{},
	}, nil
}

func mapGRPCError(err error) error {
	if err == nil {
		return nil
	}
	if st, ok := status.FromError(err); ok {
		return errors.New(st.Message())
	}
	return err
}
