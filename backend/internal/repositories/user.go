package repositories

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc"
)

var (
	ErrInternalDBError   = errors.New("internal db error")
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrUserNotFound      = errors.New("user not found")
)

type UserRepository struct {
	db *database.DB
}

func NewUserRepository(db *database.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (dbgen.User, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return dbgen.User{}, err
	}

	user, err := r.db.Queries.GetUserByID(ctx, uid)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return dbgen.User{}, ErrUserNotFound
		}
		return dbgen.User{}, ErrInternalDBError
	}
	return user, nil
}

func (r *UserRepository) GetByIDs(ctx context.Context, ids []string) ([]dbgen.User, error) {
	if len(ids) == 0 {
		return []dbgen.User{}, nil
	}

	uuids := make([]uuid.UUID, len(ids))
	for i, id := range ids {
		uid, err := uuid.Parse(id)
		if err != nil {
			return nil, err
		}
		uuids[i] = uid
	}

	users, err := r.db.Queries.GetUsersByIDs(ctx, uuids)
	if err != nil {
		return nil, ErrInternalDBError
	}
	return users, nil
}

func (r *UserRepository) CreateUser(ctx context.Context, arg dbgen.CreateUserParams) (dbgen.User, error) {
	user, err := r.db.Queries.CreateUser(ctx, arg)
	if err != nil {
		return dbgen.User{}, ErrInternalDBError
	}
	return user, nil
}

func (r *UserRepository) SearchByUsername(ctx context.Context, query string) ([]dbgen.User, error) {
	users, err := r.db.Queries.SearchUsersByUsername(ctx, dbgen.ToNullString(query))
	if err != nil {
		return nil, err
	}
	return users, nil
}
