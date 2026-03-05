package graph

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"google.golang.org/grpc/status"

	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/model"
	chatpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/chat/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/models"
)

func (r *Resolver) enrichChat(ctx context.Context, authID string, pbChat *chatpb.Chat) (*model.Chat, error) {
	parsedAuthID, _ := uuid.Parse(authID)
	chatID, _ := uuid.Parse(pbChat.Id)

	chatType := model.ChatTypePrivate
	if pbChat.Type == chatpb.ChatType_CHAT_TYPE_GROUP {
		chatType = model.ChatTypeGroup
	} else if pbChat.Type == chatpb.ChatType_CHAT_TYPE_CHANNEL {
		chatType = model.ChatTypeChannel
	}

	dbMembers, _ := r.db.Queries.GetDialogMembers(ctx, chatID)

	var (
		isPinned  bool
		myReadSeq int64
		pReadSeq  int64
		idsMap    = make(map[uuid.UUID]bool)
	)

	for _, m := range dbMembers {
		idsMap[m.UserID] = true
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
		if msgID, err := uuid.Parse(pbChat.LastMessageId); err == nil {
			if m, err := r.db.Queries.GetMessageByID(ctx, msgID); err == nil {
				lastMsg = &models.Message{
					ID:           m.ID,
					DialogID:     m.DialogID,
					AuthorID:     m.AuthorID,
					Content:      m.Content,
					CreatedAt:    m.CreatedAt,
					Sequence:     m.Sequence,
					IsEncrypted:  m.IsEncrypted,
					EncryptionIv: nullStringToPointer(m.EncryptionIv),
				}
				idsMap[m.AuthorID] = true
			}
		}
	}

	userIDs := make([]uuid.UUID, 0, len(idsMap))
	for id := range idsMap {
		userIDs = append(userIDs, id)
	}

	dbUsers, _ := r.userRepo.GetByIDs(ctx, userIDs)
	userMap := make(map[uuid.UUID]*models.User)
	for i := range dbUsers {
		u := dbUsers[i]
		userMap[u.ID] = &models.User{
			ID:               u.ID,
			Username:         nullStringToPointer(u.Username),
			FirstName:        u.FirstName,
			LastName:         nullStringToPointer(u.LastName),
			Email:            u.Email,
			PublicKey:        nullStringToPointer(u.PublicKey),
			EncryptedPrivKey: nullStringToPointer(u.EncryptedPrivKey),
			EncryptionIv:     nullStringToPointer(u.EncryptionIv),
		}
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

func mapGRPCError(err error) error {
	if err == nil {
		return nil
	}
	if st, ok := status.FromError(err); ok {
		return errors.New(st.Message())
	}
	return err
}

func StringPtr(s string) *string {
	return &s
}

func nullStringToPointer(s sql.NullString) *string {
	if !s.Valid {
		return nil
	}
	return &s.String
}
