package repositories

import (
	"errors"

	"github.com/aerogram-org/aerogram-api/internal/models"
	"gorm.io/gorm"
)

var (
	ErrInternalDBError   = errors.New("internal db error")
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrUserNotFound      = errors.New("user not found")
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetByIDs(ids []string) ([]*models.User, error) {
	var users []*models.User
	if len(ids) == 0 {
		return users, nil
	}
	if err := r.db.Where("id IN ?", ids).Find(&users).Error; err != nil {
		return nil, ErrInternalDBError
	}
	return users, nil
}

func (r *UserRepository) IsUserExists(u *models.User) (bool, error) {
	var count int64
	if err := r.db.Model(&models.User{}).Where("id = ?", u.ID).Count(&count).Error; err != nil {
		return false, ErrInternalDBError
	}
	return count > 0, nil
}

func (r *UserRepository) CreateUser(u *models.User) error {
	if err := r.db.Create(u).Error; err != nil {
		return ErrInternalDBError
	}
	return nil
}

func (r *UserRepository) GetByID(id string) (*models.User, error) {
	var u models.User
	if err := r.db.First(&u, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, ErrInternalDBError
	}
	return &u, nil
}

func (r *UserRepository) SearchByUsername(query string) ([]*models.User, error) {
	var users []*models.User
	err := r.db.Where("username ILIKE ? AND username != ''", query+"%").Limit(20).Find(&users).Error
	return users, err
}

func (r *UserRepository) UpdateProfile(id string, updates map[string]interface{}) (*models.User, error) {
	var u models.User
	if err := r.db.Model(&u).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, ErrInternalDBError
	}
	return r.GetByID(id)
}

func (r *UserRepository) GetByEmail(email string) (*models.User, error) {
	var u models.User
	if err := r.db.Where("email = ?", email).First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) GetSessions(userID string) ([]*models.Session, error) {
	var sessions []*models.Session
	if err := r.db.Where("user_id = ?", userID).Find(&sessions).Error; err != nil {
		return nil, err
	}
	return sessions, nil
}

func (r *UserRepository) Search(query string) ([]*models.User, error) {
	var users []*models.User
	err := r.db.Where("username ILIKE ? OR first_name ILIKE ?", "%"+query+"%", "%"+query+"%").
		Limit(20).
		Find(&users).Error
	return users, err
}

func (r *UserRepository) TerminateSession(sessionID string) error {
	if err := r.db.Model(&models.Session{}).Where("id = ?", sessionID).Update("is_active", false).Error; err != nil {
		return ErrInternalDBError
	}
	return nil
}

func (r *UserRepository) TerminateUserSessions(userID string) error {
	if err := r.db.Model(&models.Session{}).Where("user_id = ?", userID).Update("is_active", false).Error; err != nil {
		return ErrInternalDBError
	}
	return nil
}

func (r *UserRepository) GetActiveSession(sessionID string) (*models.Session, error) {
	var s models.Session
	if err := r.db.Where("id = ? AND is_active = ?", sessionID, true).First(&s).Error; err != nil {
		return nil, err
	}
	return &s, nil
}
