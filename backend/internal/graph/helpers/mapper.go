package helpers

import (
	"time"

	"github.com/google/uuid"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/model"
	messagesv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/messages/v1"
)

func MapMessageToModel(m *messagesv1.Message) *model.Message {
	if m == nil {
		return nil
	}

	senderID, _ := uuid.Parse(m.SenderId)

	return &model.Message{
		ID:       m.Id,
		ChatID:   m.ChatId,
		Text:     m.Text,
		SentAt:   m.SentAt,
		Sequence: m.Sequence,
		IsEdited: m.IsEdited,
		Sender: &dbgen.User{
			ID: senderID,
		},
	}
}

func MapDBMessageToModel(m *dbgen.Message) *model.Message {
	if m == nil {
		return nil
	}

	msg := &model.Message{
		ID:       m.ID.String(),
		ChatID:   m.DialogID.String(),
		Text:     m.Content,
		SentAt:   m.CreatedAt.Format(time.RFC3339),
		Sequence: m.Sequence,
		IsEdited: m.IsEdited,
	}

	if m.AuthorID != uuid.Nil {
		msg.Sender = &dbgen.User{
			ID: m.AuthorID,
		}
	}

	if m.ReplyToID.Valid {
		msg.ReplyTo = &model.Message{
			ID: m.ReplyToID.UUID.String(),
		}
	}

	return msg
}
