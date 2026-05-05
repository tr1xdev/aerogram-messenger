package helpers

import (
	"context"
	"database/sql"
	"errors"
	"strings"
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

func (e *ChatEnricher) EnrichChat(ctx context.Context, authID string, pbChat *chatv1.Chat) (*model.ChatExtended, error) {
	chatID, err := uuid.Parse(pbChat.Id)
	if err != nil {
		return nil, err
	}

	var pinnedMsgID uuid.NullUUID
	if pbChat.PinnedMessageId != nil && *pbChat.PinnedMessageId != "" {
		if pID, err := uuid.Parse(*pbChat.PinnedMessageId); err == nil {
			pinnedMsgID = uuid.NullUUID{UUID: pID, Valid: true}
		}
	}

	var lastMsgID uuid.NullUUID
	if pbChat.LastMessageId != "" {
		if lID, err := uuid.Parse(pbChat.LastMessageId); err == nil {
			lastMsgID = uuid.NullUUID{UUID: lID, Valid: true}
		}
	}

	chatType := strings.TrimPrefix(pbChat.Type.String(), "CHAT_TYPE_")
	ext := &model.ChatExtended{
		Dialog: dbgen.Dialog{
			ID:              chatID,
			Type:            chatType,
			Name:            sql.NullString{String: pbChat.Title, Valid: pbChat.Title != ""},
			Username:        sql.NullString{String: pbChat.Slug, Valid: pbChat.Slug != ""},
			PhotoUrl:        sql.NullString{String: pbChat.PhotoUrl, Valid: pbChat.PhotoUrl != ""},
			Bio:             ToNullString(pbChat.Bio),
			Description:     ToNullString(pbChat.Description),
			PinnedMessageID: pinnedMsgID,
			LastMessageID:   lastMsgID,
			MembersCount:    pbChat.MembersCount,
			IsVerified:      pbChat.IsVerified,
			IsActive:        pbChat.CanWrite,
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		},
		UnreadCount:     int(pbChat.UnreadCount),
		ReadOutboxMaxId: pbChat.LastReadSequence,
		ReadInboxMaxId:  pbChat.LastReadSequence,
	}

	if authID != "" {
		uid, _ := uuid.Parse(authID)
		member, err := e.store.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
			DialogID: chatID,
			UserID:   uid,
		})
		if err == nil {
			ext.Role = member.Role
			ext.IsPinned = member.IsPinned
			ext.MyReadSequence = member.LastReadSequence
		}

		if chatType == "PRIVATE" {
			opponent, err := e.store.GetDialogOpponent(ctx, dbgen.GetDialogOpponentParams{
				DialogID: chatID,
				UserID:   uid,
			})
			if err == nil {
				ext.OpponentReadSequence = opponent.LastReadSequence
				ext.ReadOutboxMaxId = opponent.LastReadSequence

				if !ext.Name.Valid || ext.Name.String == "" {
					user, err := e.store.GetUserByID(ctx, opponent.UserID)
					if err == nil {
						ext.Name = sql.NullString{
							String: FormatFullName(user.FirstName, user.LastName),
							Valid:  true,
						}
					}
				}
			} else if errors.Is(err, sql.ErrNoRows) {
				ext.Name = sql.NullString{String: "Saved Messages", Valid: true}
			}
		}
	}

	return ext, nil
}

func (e *ChatEnricher) EnrichMessage(ctx context.Context, messageID string) (*model.Message, error) {
	uid, err := uuid.Parse(messageID)
	if err != nil {
		return nil, err
	}

	msg, err := e.store.GetMessageByID(ctx, uid)
	if err != nil {
		return nil, err
	}

	return MapDBMessageToModel(&msg), nil
}

func (e *ChatEnricher) EnrichUser(ctx context.Context, userID string) (*dbgen.User, error) {
	uid, err := uuid.Parse(ToRawID(userID))
	if err != nil {
		return nil, err
	}
	user, err := e.store.GetUserByID(ctx, uid)
	if err != nil {
		return nil, err
	}
	if user.PhotoUrl.Valid && user.PhotoUrl.String != "" {
		if signed, err := e.s3.GetPresignedURL(ctx, user.PhotoUrl.String, time.Hour*24); err == nil {
			user.PhotoUrl.String = signed
		}
	}
	return &user, nil
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
