package repositories

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
)

const MaxPinnedChats = 5

type DialogRepository struct {
	db *database.DB
}

func NewDialogRepository(db *database.DB) *DialogRepository {
	return &DialogRepository{db: db}
}

func (r *DialogRepository) CreateDialog(
	ctx context.Context,
	dParams dbgen.CreateDialogParams,
	mParams []dbgen.AddDialogMemberParams,
	sParams dbgen.CreateDialogSettingsParams,
) error {
	tx, err := r.db.Conn.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	qtx := r.db.Queries.WithTx(tx)

	if _, err := qtx.CreateDialog(ctx, dParams); err != nil {
		return fmt.Errorf("create dialog: %w", err)
	}

	if err := qtx.CreateDialogSettings(ctx, sParams); err != nil {
		return fmt.Errorf("create settings: %w", err)
	}

	for _, member := range mParams {
		if err := qtx.AddDialogMember(ctx, member); err != nil {
			return fmt.Errorf("add member: %w", err)
		}
	}

	return tx.Commit()
}

func (r *DialogRepository) GetUserDialogs(ctx context.Context, userID string) ([]dbgen.GetUserDialogsRow, error) {
	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user id: %w", err)
	}
	return r.db.Queries.GetUserDialogs(ctx, uid)
}

func (r *DialogRepository) GetDialogByID(ctx context.Context, id string) (dbgen.Dialog, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return dbgen.Dialog{}, fmt.Errorf("invalid dialog id: %w", err)
	}
	return r.db.Queries.GetDialogByID(ctx, uid)
}

func (r *DialogRepository) GetMember(ctx context.Context, dialogID, userID string) (dbgen.DialogMember, error) {
	did, err := uuid.Parse(dialogID)
	if err != nil {
		return dbgen.DialogMember{}, fmt.Errorf("invalid dialog id: %w", err)
	}
	uid, err := uuid.Parse(userID)
	if err != nil {
		return dbgen.DialogMember{}, fmt.Errorf("invalid user id: %w", err)
	}
	return r.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
		DialogID: did,
		UserID:   uid,
	})
}

func (r *DialogRepository) GetMembers(ctx context.Context, dialogID string) ([]dbgen.GetDialogMembersRow, error) {
	did, err := uuid.Parse(dialogID)
	if err != nil {
		return nil, fmt.Errorf("invalid dialog id: %w", err)
	}
	return r.db.Queries.GetDialogMembers(ctx, did)
}

func (r *DialogRepository) GetDialogByUsername(ctx context.Context, username string) (dbgen.Dialog, error) {
	if username == "" {
		return dbgen.Dialog{}, fmt.Errorf("username is empty")
	}
	return r.db.Queries.GetDialogByUsername(ctx, sql.NullString{String: username, Valid: true})
}

func (r *DialogRepository) UpdateLastMessage(ctx context.Context, chatID uuid.UUID, messageID uuid.UUID, at sql.NullTime) error {
	return r.db.Queries.UpdateDialogLastMessage(ctx, dbgen.UpdateDialogLastMessageParams{
		ID:            chatID,
		LastMessageID: uuid.NullUUID{UUID: messageID, Valid: true},
		LastMessageAt: at,
	})
}

func (r *DialogRepository) Delete(ctx context.Context, dialogID string) error {
	did, err := uuid.Parse(dialogID)
	if err != nil {
		return fmt.Errorf("invalid dialog id: %w", err)
	}
	return r.db.Queries.DeleteDialog(ctx, did)
}

func (r *DialogRepository) Pin(ctx context.Context, dialogID, userID string, pinned bool) error {
	did, err := uuid.Parse(dialogID)
	if err != nil {
		return fmt.Errorf("invalid dialog id: %w", err)
	}
	uid, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user id: %w", err)
	}

	if pinned {
		count, err := r.db.Queries.CountPinnedDialogs(ctx, uid)
		if err != nil {
			return fmt.Errorf("failed to count pinned chats: %w", err)
		}

		currentMember, err := r.db.Queries.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
			DialogID: did,
			UserID:   uid,
		})

		if err == nil && !currentMember.IsPinned && count >= MaxPinnedChats {
			return fmt.Errorf("limit reached: maximum %d pinned chats allowed", MaxPinnedChats)
		}
	}

	return r.db.Queries.PinDialog(ctx, dbgen.PinDialogParams{
		DialogID: did,
		UserID:   uid,
		IsPinned: pinned,
	})
}

func (r *DialogRepository) GetPrivateDialogByMembers(ctx context.Context, user1, user2 string) (dbgen.Dialog, error) {
	u1, err := uuid.Parse(user1)
	if err != nil {
		return dbgen.Dialog{}, fmt.Errorf("invalid first user id: %w", err)
	}
	u2, err := uuid.Parse(user2)
	if err != nil {
		return dbgen.Dialog{}, fmt.Errorf("invalid second user id: %w", err)
	}

	return r.db.Queries.GetPrivateDialogByMembers(ctx, dbgen.GetPrivateDialogByMembersParams{
		UserID:   u1,
		UserID_2: u2,
	})
}

func (r *DialogRepository) PinChat(ctx context.Context, dialogID, userID uuid.UUID, pinned bool) error {
	return r.db.Queries.UpdateMemberPinStatus(ctx, dbgen.UpdateMemberPinStatusParams{
		DialogID: dialogID,
		UserID:   userID,
		IsPinned: pinned,
	})
}

func (r *DialogRepository) DeleteChat(ctx context.Context, dialogID, userID uuid.UUID, forEveryone bool) error {
	if forEveryone {
		return r.db.Queries.DeleteDialog(ctx, dialogID)
	}

	tx, err := r.db.Conn.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		_ = tx.Rollback()
	}()

	qtx := r.db.Queries.WithTx(tx)

	if err := qtx.RemoveDialogMember(ctx, dbgen.RemoveDialogMemberParams{DialogID: dialogID, UserID: userID}); err != nil {
		return err
	}

	if err := qtx.DecrementMembersCount(ctx, dialogID); err != nil {
		return err
	}

	return tx.Commit()
}
