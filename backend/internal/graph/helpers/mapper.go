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

	msg := &model.Message{
		ID:       m.Id,
		ChatID:   EncodeGlobalID("Chat", m.ChatId),
		Text:     m.Text,
		SentAt:   m.SentAt,
		Sequence: m.Sequence,
		IsEdited: m.IsEdited,
	}

	if m.SenderId != "" {
		msg.Sender = &dbgen.User{
			ID: uuid.MustParse(ToRawID(m.SenderId)),
		}
	}

	if m.ReplyToId != nil && *m.ReplyToId != "" {
		msg.ReplyTo = &model.Message{
			ID: EncodeGlobalID("Message", ToRawID(*m.ReplyToId)),
		}
	}

	return msg
}

func MapDBMessageToModel(m *dbgen.Message) *model.Message {
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

	if m.AuthorID != uuid.Nil {
		msg.Sender = &dbgen.User{
			ID: m.AuthorID,
		}
	}

	if m.ReplyToID.Valid {
		msg.ReplyTo = &model.Message{
			ID: EncodeGlobalID("Message", m.ReplyToID.UUID.String()),
		}
	}

	return msg
}
