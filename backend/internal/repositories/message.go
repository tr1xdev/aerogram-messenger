package repositories

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
)

type MessageRepository struct {
	db *database.DB
}

func NewMessageRepository(db *database.DB) *MessageRepository {
	return &MessageRepository{db: db}
}

func (r *MessageRepository) Create(ctx context.Context, arg dbgen.CreateMessageParams) (dbgen.Message, error) {
	tx, err := r.db.Conn.BeginTx(ctx, nil)
	if err != nil {
		return dbgen.Message{}, err
	}
	defer tx.Rollback()

	qtx := r.db.Queries.WithTx(tx)

	msg, err := qtx.CreateMessage(ctx, arg)
	if err != nil {
		return dbgen.Message{}, fmt.Errorf("failed to create message: %w", err)
	}

	err = qtx.UpdateDialogLastMessage(ctx, dbgen.UpdateDialogLastMessageParams{
		ID:            arg.DialogID,
		LastMessageID: uuid.NullUUID{UUID: msg.ID, Valid: true},
		LastMessageAt: database.ToNullTime(&msg.CreatedAt),
	})
	if err != nil {
		return dbgen.Message{}, fmt.Errorf("failed to update dialog: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return dbgen.Message{}, err
	}

	return msg, nil
}

func (r *MessageRepository) GetHistory(ctx context.Context, chatID uuid.UUID, limit, offset int32) ([]dbgen.GetChatHistoryRow, error) {
	return r.db.Queries.GetChatHistory(ctx, dbgen.GetChatHistoryParams{
		DialogID: chatID,
		Limit:    limit,
		Offset:   offset,
	})
}

func (r *MessageRepository) GetByID(ctx context.Context, id uuid.UUID) (dbgen.Message, error) {
	return r.db.Queries.GetMessageByID(ctx, id)
}

func (r *MessageRepository) Update(ctx context.Context, id, authorID uuid.UUID, content string) (dbgen.Message, error) {
	return r.db.Queries.UpdateMessageExtended(ctx, dbgen.UpdateMessageExtendedParams{
		ID:           id,
		AuthorID:     authorID,
		Content:      content,
		EncryptionIv: database.ToNullString(nil),
	})
}

func (r *MessageRepository) Delete(ctx context.Context, id, authorID uuid.UUID) error {
	return r.db.Queries.SoftDeleteMessage(ctx, dbgen.SoftDeleteMessageParams{
		ID:       id,
		AuthorID: authorID,
	})
}

func (r *MessageRepository) MarkRead(ctx context.Context, chatID, userID uuid.UUID, seq int64) error {
	return r.db.Queries.UpdateMemberReadSequence(ctx, dbgen.UpdateMemberReadSequenceParams{
		DialogID:         chatID,
		UserID:           userID,
		LastReadSequence: seq,
	})
}

func (r *MessageRepository) UpdateExtended(ctx context.Context, arg dbgen.UpdateMessageExtendedParams) (dbgen.Message, error) {
	return r.db.Queries.UpdateMessageExtended(ctx, arg)
}
