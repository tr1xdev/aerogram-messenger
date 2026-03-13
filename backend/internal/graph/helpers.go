package graph

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/model"
	chatpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/chat/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/models"
	"google.golang.org/grpc/status"
)

func (r *Resolver) enrichChat(ctx context.Context, authID string, pbChat *chatpb.Chat) (*model.Chat, error) {
	parsedAuthID, err := uuid.Parse(authID)
	if err != nil {
		return nil, fmt.Errorf("auth id parse fail: %w", err)
	}

	chatID, err := uuid.Parse(pbChat.Id)
	if err != nil {
		return nil, fmt.Errorf("chat id parse fail: %w", err)
	}

	chatType := model.ChatTypePrivate
	switch pbChat.Type {
	case chatpb.ChatType_CHAT_TYPE_GROUP:
		chatType = model.ChatTypeGroup
	case chatpb.ChatType_CHAT_TYPE_CHANNEL:
		chatType = model.ChatTypeChannel
	}

	dbMembers, err := r.db.Queries.GetDialogMembers(ctx, chatID)
	if err != nil {
		return nil, fmt.Errorf("fetch members fail: %w", err)
	}

	idsMap := make(map[uuid.UUID]struct{}, len(dbMembers)+1)
	var pReadSeq int64

	for _, m := range dbMembers {
		idsMap[m.UserID] = struct{}{}
		if m.UserID != parsedAuthID {
			if chatType == model.ChatTypePrivate {
				pReadSeq = m.LastReadSequence
			} else if m.LastReadSequence > pReadSeq {
				pReadSeq = m.LastReadSequence
			}
		}
	}

	if pbChat.LastMessage != nil && pbChat.LastMessage.SenderId != "" {
		if authorID, err := uuid.Parse(pbChat.LastMessage.SenderId); err == nil && authorID != uuid.Nil {
			idsMap[authorID] = struct{}{}
		}
	}

	userMap := make(map[uuid.UUID]*models.User, len(idsMap))
	for id := range idsMap {
		u, err := LoadUser(ctx, id.String())
		if err != nil {
			continue
		}
		if u != nil {
			userMap[u.ID] = u
		}
	}

	gqlMembers := make([]*model.ChatMember, 0, len(dbMembers))
	for _, m := range dbMembers {
		u, ok := userMap[m.UserID]
		if !ok {
			tempU, _ := LoadUser(ctx, m.UserID.String())
			u = tempU
		}
		if u != nil {
			gqlMembers = append(gqlMembers, &model.ChatMember{
				User:             u,
				LastReadSequence: m.LastReadSequence,
			})
		}
	}

	var lastMsg *models.Message
	if m := pbChat.LastMessage; m != nil {
		mID, _ := uuid.Parse(m.Id)
		aID, _ := uuid.Parse(m.SenderId)

		lastMsg = &models.Message{
			ID:           mID,
			DialogID:     chatID,
			AuthorID:     aID,
			Content:      m.Text,
			Sequence:     m.Sequence,
			IsEncrypted:  m.IsEncrypted,
			EncryptionIv: m.EncryptionIv,
		}

		if aID != uuid.Nil {
			if u, ok := userMap[aID]; ok {
				lastMsg.Sender = u
			} else {
				lastMsg.Sender, _ = LoadUser(ctx, aID.String())
			}
		}

		if m.SentAt != "" {
			if t, err := time.Parse(time.RFC3339, m.SentAt); err == nil {
				lastMsg.CreatedAt = t
			}
		}
	}

	displayTitle := pbChat.Title
	if chatType == model.ChatTypePrivate {
		for id, u := range userMap {
			if id != parsedAuthID {
				displayTitle = u.FirstName
				if u.LastName != nil && *u.LastName != "" {
					displayTitle += " " + *u.LastName
				}
				break
			}
		}
	}

	return &model.Chat{
		ID:               pbChat.Id,
		Type:             chatType,
		Title:            displayTitle,
		Slug:             &pbChat.Slug,
		MembersCount:     int(pbChat.MembersCount),
		Members:          gqlMembers,
		LastMessage:      lastMsg,
		UnreadCount:      int(pbChat.UnreadCount),
		IsPinned:         pbChat.IsPinned,
		LastReadSequence: pReadSeq,
	}, nil
}

func toStringPtr(val interface{}) *string {
	if val == nil {
		return nil
	}
	switch v := val.(type) {
	case string:
		return &v
	case *string:
		return v
	case []byte:
		s := string(v)
		return &s
	case interface {
		IsValid() bool
		String() string
	}:
		if v.IsValid() {
			s := v.String()
			return &s
		}
		return nil
	}
	return nil
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
