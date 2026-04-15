package helpers

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/model"
	chatv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/chat/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/infrastructure/storage"
	"google.golang.org/grpc/status"
)

type ChatEnricher struct {
	store dbgen.Querier
	s3    *storage.S3Storage
}

func NewChatEnricher(store dbgen.Querier, s3 *storage.S3Storage) *ChatEnricher {
	return &ChatEnricher{
		store: store,
		s3:    s3,
	}
}

func (e *ChatEnricher) EnrichChat(ctx context.Context, authID string, pbChat *chatv1.Chat) (*model.Chat, error) {
	parsedAuthID, err := uuid.Parse(authID)
	if err != nil {
		return nil, err
	}

	chatID, err := uuid.Parse(pbChat.Id)
	if err != nil {
		return nil, err
	}

	chatType := model.ChatTypePrivate
	switch pbChat.Type {
	case chatv1.ChatType_CHAT_TYPE_GROUP:
		chatType = model.ChatTypeGroup
	case chatv1.ChatType_CHAT_TYPE_CHANNEL:
		chatType = model.ChatTypeChannel
	}

	dbMembers, err := e.store.GetDialogMembers(ctx, chatID)
	if err != nil {
		dbMembers = []dbgen.GetDialogMembersRow{}
	}

	idsMap := make(map[uuid.UUID]bool)
	var isPinned bool
	var myReadSeq int64
	var pReadSeq int64

	for _, m := range dbMembers {
		idsMap[m.UserID] = true
		if m.UserID == parsedAuthID {
			isPinned = m.IsPinned
			myReadSeq = m.LastReadSequence
		} else if chatType == model.ChatTypePrivate {
			pReadSeq = m.LastReadSequence
		} else {
			if m.LastReadSequence > pReadSeq {
				pReadSeq = m.LastReadSequence
			}
		}
	}

	var lastMsg *model.Message
	if pbChat.LastMessageId != "" {
		if mID, err := uuid.Parse(pbChat.LastMessageId); err == nil {
			if m, err := e.store.GetMessageByID(ctx, mID); err == nil {
				lastMsg = MapDBMessageToModel(&m)
				if m.AuthorID != uuid.Nil {
					idsMap[m.AuthorID] = true
				}
			}
		}
	}

	userIDs := make([]uuid.UUID, 0, len(idsMap))
	for id := range idsMap {
		userIDs = append(userIDs, id)
	}

	dbUsers, _ := e.store.GetUsersByIDs(ctx, userIDs)
	userMap := make(map[uuid.UUID]*dbgen.User)
	for i := range dbUsers {
		u := dbUsers[i]
		if u.PhotoUrl.Valid && u.PhotoUrl.String != "" {
			if signed, err := e.s3.GetPresignedURL(ctx, u.PhotoUrl.String, time.Hour*24); err == nil {
				u.PhotoUrl.String = signed
			}
		}
		userMap[u.ID] = &u
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

	displayTitle := pbChat.Title
	var displayPhoto *string

	if pbChat.PhotoUrl != "" {
		if signed, err := e.s3.GetPresignedURL(ctx, pbChat.PhotoUrl, time.Hour*24); err == nil {
			displayPhoto = &signed
		}
	}

	if chatType == model.ChatTypePrivate {
		foundPartner := false
		for id, u := range userMap {
			if id != parsedAuthID {
				displayTitle = FormatFullName(u.FirstName, u.LastName)
				if displayPhoto == nil && u.PhotoUrl.Valid {
					displayPhoto = &u.PhotoUrl.String
				}
				foundPartner = true
				break
			}
		}
		if !foundPartner && displayTitle == "" {
			displayTitle = "Deleted Account"
		}
	}

	if displayTitle == "" && chatType != model.ChatTypePrivate {
		displayTitle = "Untitled Chat"
	}

	uCount, _ := e.store.CountUnreadMessages(ctx, dbgen.CountUnreadMessagesParams{
		DialogID: chatID,
		AuthorID: parsedAuthID,
		Sequence: myReadSeq,
	})

	return &model.Chat{
		ID:               pbChat.Id,
		Type:             chatType,
		Title:            displayTitle,
		PhotoURL:         displayPhoto,
		Slug:             &pbChat.Slug,
		MembersCount:     int(pbChat.MembersCount),
		Members:          gqlMembers,
		LastMessage:      lastMsg,
		UnreadCount:      int(uCount),
		IsPinned:         isPinned,
		MyReadSequence:   myReadSeq,
		LastReadSequence: pReadSeq,
		CreatedAt:        time.Now().Format(time.RFC3339),
	}, nil
}

func NullStringToStringPtr(ns sql.NullString) *string {
	if !ns.Valid {
		return nil
	}
	return &ns.String
}

func MapGRPCError(err error) error {
	if err == nil {
		return nil
	}
	if st, ok := status.FromError(err); ok {
		return errors.New(st.Message())
	}
	return err
}

func MapDBMemberToModel(m *dbgen.GetDialogMembersRow, u *dbgen.User) *model.ChatMember {
	if m == nil {
		return nil
	}
	return &model.ChatMember{
		User:             u,
		LastReadSequence: m.LastReadSequence,
	}
}

func FormatFullName(firstName string, lastName sql.NullString) string {
	name := firstName
	if lastName.Valid && lastName.String != "" {
		name += " " + lastName.String
	}
	return name
}

func ToStringPtr(ns sql.NullString) *string {
	if !ns.Valid {
		return nil
	}
	return &ns.String
}

func ToNullString(s *string) sql.NullString {
	if s == nil {
		return sql.NullString{String: "", Valid: false}
	}
	return sql.NullString{String: *s, Valid: true}
}
