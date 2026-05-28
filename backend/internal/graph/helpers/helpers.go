package helpers

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/model"
	chatv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/chat/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/infrastructure/storage"
	"github.com/tr1xdev/aerogram-messenger/internal/middleware"
	"google.golang.org/grpc/status"
)

type ChatEnricher struct {
	store dbgen.Querier
	s3    storage.Provider
}

func NewChatEnricher(store dbgen.Querier, s3 storage.Provider) *ChatEnricher {
	return &ChatEnricher{
		store: store,
		s3:    s3,
	}
}

func (e *ChatEnricher) EnrichChat(ctx context.Context, authID string, pbChat *chatv1.Chat) (*model.ChatExtended, error) {
	if pbChat == nil {
		return nil, nil
	}

	rawChatID := ToRawID(pbChat.Id)
	chatID, err := uuid.Parse(rawChatID)
	if err != nil {
		log.Printf("[Enricher] Error parsing Chat ID '%s': %v", rawChatID, err)
		return nil, nil
	}

	var pinnedMsgID uuid.NullUUID
	if pbChat.PinnedMessageId != nil && *pbChat.PinnedMessageId != "" {
		if pID, err := uuid.Parse(ToRawID(*pbChat.PinnedMessageId)); err == nil {
			pinnedMsgID = uuid.NullUUID{UUID: pID, Valid: true}
		}
	}

	var lastMsgID uuid.NullUUID
	if pbChat.LastMessageId != "" {
		if lID, err := uuid.Parse(ToRawID(pbChat.LastMessageId)); err == nil {
			lastMsgID = uuid.NullUUID{UUID: lID, Valid: true}
		}
	}

	chatType := strings.ToLower(strings.TrimPrefix(pbChat.Type.String(), "CHAT_TYPE_"))

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
		uid, err := uuid.Parse(ToRawID(authID))
		if err == nil {
			member, err := e.store.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
				DialogID: chatID,
				UserID:   uid,
			})

			if err == nil {
				ext.Role = member.Role
				ext.IsPinned = member.IsPinned
				ext.MyReadSequence = member.LastReadSequence
			} else {
				ext.Role = "NONE"
				ext.IsPinned = false
				ext.MyReadSequence = 0

				if pbChat.Slug == "" && chatType == "channel" {
					return nil, errors.New("PRIVATE_CHAT_ACCESS_DENIED")
				}
			}

			if chatType == "private" {
				opponent, err := e.store.GetDialogOpponent(ctx, dbgen.GetDialogOpponentParams{
					DialogID: chatID,
					UserID:   uid,
				})
				if err == nil {
					ext.OpponentReadSequence = opponent.LastReadSequence
					if opponent.LastReadSequence > 0 {
						ext.ReadOutboxMaxId = opponent.LastReadSequence
					}

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
	}

	return ext, nil
}

func (e *ChatEnricher) EnrichMessage(ctx context.Context, messageID string) (*model.Message, error) {
	uid, err := uuid.Parse(ToRawID(messageID))
	if err != nil {
		return nil, err
	}

	msg, err := e.store.GetMessageByID(ctx, uid)
	if err != nil {
		return nil, err
	}

	mapped := e.MapDBMessageToModel(&msg)
	mapped.ChatID = EncodeGlobalID("Chat", msg.DialogID.String())

	author, err := e.store.GetUserByID(ctx, msg.AuthorID)
	if err == nil {
		if author.PhotoUrl.Valid && author.PhotoUrl.String != "" && e.s3 != nil {
			if signed, err := e.s3.GetPresignedURL(ctx, author.PhotoUrl.String, time.Hour*24); err == nil {
				author.PhotoUrl.String = signed
			}
		}
		mapped.Sender = &author
	}

	if msg.ReplyToID.Valid {
		replyMsg, err := e.store.GetMessageByID(ctx, msg.ReplyToID.UUID)
		if err == nil {
			mapped.ReplyTo = e.MapDBMessageToModel(&replyMsg)
			replyAuthor, err := e.store.GetUserByID(ctx, replyMsg.AuthorID)
			if err == nil {
				mapped.ReplyTo.Sender = &replyAuthor
			}
		}
	}

	attachments, err := e.store.GetAttachmentsByMessageID(ctx, uid)
	if err == nil && len(attachments) > 0 {
		mapped.Attachments = make([]*model.Attachment, 0, len(attachments))
		for _, a := range attachments {
			mapped.Attachments = append(mapped.Attachments, &model.Attachment{
				ID:          EncodeGlobalID("Attachment", a.ID.String()),
				Type:        a.Type,
				URL:         a.FileName,
				FileName:    ExtractOriginalFileName(a.FileName),
				FileSize:    a.FileSize,
				ContentType: a.Type,
			})
		}
	}

	return mapped, nil
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
		if e.s3 != nil {
			if signed, err := e.s3.GetPresignedURL(ctx, user.PhotoUrl.String, time.Hour*24); err == nil {
				user.PhotoUrl.String = signed
			}
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

func GetUserIDFromContext(ctx context.Context) string {
	if userID, ok := ctx.Value(middleware.AuthUserIDKey).(string); ok {
		return userID
	}
	return ""
}

func ExtractOriginalFileName(storedName string) string {
	clean := storedName
	clean = strings.TrimPrefix(clean, "attachments/")
	clean = strings.TrimPrefix(clean, "attachments_")

	before, after, ok := strings.Cut(clean, "_")
	if !ok {
		return clean
	}

	potentialUUID := before
	if _, err := uuid.Parse(potentialUUID); err == nil {
		return after
	}

	return clean
}
