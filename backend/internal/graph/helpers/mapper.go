package helpers

import (
	"time"

	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/model"
	messagesv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/messages/v1"
)

func MapMessageToModel(m *messagesv1.Message) *model.Message {
	if m == nil {
		return nil
	}

	msg := &model.Message{
		ID:           m.Id,
		ChatID:       m.Id,
		Text:         m.Text,
		SentAt:       m.SentAt,
		Sequence:     m.Sequence,
		IsEdited:     m.IsEdited,
		IsEncrypted:  m.IsEncrypted,
		EncryptionIv: m.EncryptionIv,
	}

	if m.ReplyToId != nil && *m.ReplyToId != "" {
		msg.ReplyTo = &model.Message{
			ID: *m.ReplyToId,
		}
	}

	return msg
}

func MapDBMessageToModel(m *dbgen.Message) *model.Message {
	if m == nil {
		return nil
	}

	msg := &model.Message{
		ID:           m.ID.String(),
		ChatID:       m.DialogID.String(),
		Text:         m.Content,
		SentAt:       m.CreatedAt.Format(time.RFC3339),
		Sequence:     m.Sequence,
		IsEdited:     m.IsEdited,
		IsEncrypted:  m.IsEncrypted,
		EncryptionIv: NullStringToStringPtr(m.EncryptionIv),
	}

	if m.ReplyToID.Valid {
		msg.ReplyTo = &model.Message{
			ID: m.ReplyToID.UUID.String(),
		}
	}

	return msg
}
