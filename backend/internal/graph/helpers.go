package graph

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
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
	var isPinned bool
	var myReadSeq int64
	var pReadSeq int64

	for _, m := range dbMembers {
		idsMap[m.UserID] = struct{}{}
		if m.UserID == parsedAuthID {
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
		if mID, err := uuid.Parse(pbChat.LastMessageId); err == nil {
			if m, err := r.db.Queries.GetMessageByID(ctx, mID); err == nil {
				lastMsg = &models.Message{
					ID:           m.ID,
					DialogID:     m.DialogID,
					AuthorID:     m.AuthorID,
					Content:      m.Content,
					CreatedAt:    m.CreatedAt,
					Sequence:     m.Sequence,
					IsEncrypted:  m.IsEncrypted,
					EncryptionIv: toStringPtr(m.EncryptionIv),
				}
				idsMap[m.AuthorID] = struct{}{}
			}
		}
	}

	userIDs := make([]uuid.UUID, 0, len(idsMap))
	for id := range idsMap {
		userIDs = append(userIDs, id)
	}

	dbUsers, err := r.userRepo.GetByIDs(ctx, userIDs)
	if err != nil {
		return nil, fmt.Errorf("fetch users fail: %w", err)
	}

	userMap := make(map[uuid.UUID]*models.User, len(dbUsers))
	for _, u := range dbUsers {
		userMap[u.ID] = &models.User{
			ID:               u.ID,
			FirstName:        u.FirstName,
			LastName:         toStringPtr(u.LastName),
			Username:         toStringPtr(u.Username),
			PublicKey:        toStringPtr(u.PublicKey),
			EncryptedPrivKey: toStringPtr(u.EncryptedPrivKey),
			EncryptionIv:     toStringPtr(u.EncryptionIv),
		}
	}

	gqlMembers := make([]*model.ChatMember, 0, len(dbMembers))
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

	uCount, _ := r.db.Queries.CountUnreadMessages(ctx, dbgen.CountUnreadMessagesParams{
		DialogID: chatID,
		AuthorID: parsedAuthID,
		Sequence: myReadSeq,
	})

	return &model.Chat{
		ID:               pbChat.Id,
		Type:             chatType,
		Title:            displayTitle,
		Slug:             &pbChat.Slug,
		MembersCount:     int(pbChat.MembersCount),
		Members:          gqlMembers,
		LastMessage:      lastMsg,
		UnreadCount:      int(uCount),
		IsPinned:         isPinned,
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
