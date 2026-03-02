package repositories

import (
	"context"

	"github.com/aerogram-org/aerogram-api/internal/models"
	"gorm.io/gorm"
)

type DialogRepository struct {
	db *gorm.DB
}

func NewDialogRepository(db *gorm.DB) *DialogRepository {
	return &DialogRepository{db: db}
}

func (r *DialogRepository) CreateDialog(ctx context.Context, dialog *models.Dialog, members []models.DialogMember, settings *models.DialogSettings) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(dialog).Error; err != nil {
			return err
		}
		if err := tx.Create(settings).Error; err != nil {
			return err
		}
		if len(members) > 0 {
			if err := tx.Create(&members).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *DialogRepository) GetUserDialogs(ctx context.Context, userID string) ([]models.Dialog, error) {
	var dialogs []models.Dialog
	err := r.db.WithContext(ctx).
		Table("dialogs").
		Select("dialogs.*").
		Joins("JOIN dialog_members ON dialog_members.dialog_id = dialogs.id").
		Where("dialog_members.user_id = ?", userID).
		Order("dialog_members.is_pinned DESC, dialogs.last_message_at DESC").
		Find(&dialogs).Error
	return dialogs, err
}

func (r *DialogRepository) GetDialogByID(ctx context.Context, id string) (*models.Dialog, error) {
	var dialog models.Dialog
	err := r.db.WithContext(ctx).First(&dialog, "id = ?", id).Error
	return &dialog, err
}

func (r *DialogRepository) GetMember(ctx context.Context, dialogID, userID string) (*models.DialogMember, error) {
	var member models.DialogMember
	err := r.db.WithContext(ctx).
		Where("dialog_id = ? AND user_id = ?", dialogID, userID).
		First(&member).Error
	return &member, err
}

func (r *DialogRepository) GetMembers(ctx context.Context, dialogID string) ([]models.DialogMember, error) {
	var members []models.DialogMember
	err := r.db.WithContext(ctx).Where("dialog_id = ?", dialogID).Find(&members).Error
	return members, err
}
