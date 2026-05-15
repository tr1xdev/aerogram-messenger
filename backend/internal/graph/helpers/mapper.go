package helpers

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/model"
	messagesv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/messages/v1"
)

func (e *ChatEnricher) MapMessageToModel(ctx context.Context, pb *messagesv1.Message) *model.Message {
	if pb == nil {
		return nil
	}

	msg := &model.Message{
		ID:       EncodeGlobalID("Message", pb.Id),
		Text:     pb.Text,
		Sequence: pb.Sequence,
		SentAt:   pb.SentAt,
		IsEdited: pb.IsEdited,
	}

	if pb.ChatId != "" {
		msg.ChatID = EncodeGlobalID("Chat", ToRawID(pb.ChatId))
	}

	if pb.SenderId != "" {
		parsedID, _ := uuid.Parse(pb.SenderId)
		user, err := e.store.GetUserByID(ctx, parsedID)
		if err == nil {
			if user.PhotoUrl.Valid && user.PhotoUrl.String != "" && e.s3 != nil {
				if signed, err := e.s3.GetPresignedURL(ctx, user.PhotoUrl.String, time.Hour*24); err == nil {
					user.PhotoUrl.String = signed
				}
			}
			msg.Sender = &user
		} else {
			msg.Sender = &dbgen.User{
				ID: parsedID,
			}
		}
	}

	if pb.ReplyToId != nil && *pb.ReplyToId != "" {
		msg.ReplyTo = &model.Message{
			ID: EncodeGlobalID("Message", *pb.ReplyToId),
		}
	}

	if len(pb.Attachments) > 0 {
		msg.Attachments = make([]*model.Attachment, 0, len(pb.Attachments))
		for _, a := range pb.Attachments {
			cleanPath := strings.TrimPrefix(a.FileName, "attachments/")
			msg.Attachments = append(msg.Attachments, &model.Attachment{
				ID:       EncodeGlobalID("Attachment", a.Id),
				Type:     a.Type,
				URL:      "/api/media/" + cleanPath,
				FileName: a.FileName,
				FileSize: a.FileSize,
			})
		}
	}

	return msg
}

func (e *ChatEnricher) MapDBMessageToModel(m *dbgen.Message) *model.Message {
	if m == nil {
		return nil
	}

	msg := &model.Message{
		ID:       EncodeGlobalID("Message", m.ID.String()),
		ChatID:   EncodeGlobalID("Chat", m.DialogID.String()),
		Text:     m.Content,
		SentAt:   m.CreatedAt.Format(time.RFC3339),
		Sequence: m.Sequence,
		IsEdited: m.IsEdited,
	}

	msg.Sender = &dbgen.User{
		ID: m.AuthorID,
	}

	if m.ReplyToID.Valid {
		msg.ReplyTo = &model.Message{
			ID: EncodeGlobalID("Message", m.ReplyToID.UUID.String()),
		}
	}

	return msg
}
