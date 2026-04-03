package repositories

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
)

type UserRepository struct {
	db *database.DB
}

func NewUserRepository(db *database.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(ctx context.Context, arg dbgen.CreateUserParams) (dbgen.User, error) {
	return r.db.Queries.CreateUser(ctx, arg)
}

func (r *UserRepository) CreateBot(ctx context.Context, arg dbgen.CreateBotParams) (dbgen.User, error) {
	return r.db.Queries.CreateBot(ctx, arg)
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (dbgen.User, error) {
	return r.db.Queries.GetUserByID(ctx, id)
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (dbgen.User, error) {
	return r.db.Queries.GetUserByEmail(ctx, sql.NullString{String: email, Valid: true})
}

func (r *UserRepository) GetByBotToken(ctx context.Context, tokenHash string) (dbgen.User, error) {
	return r.db.Queries.GetUserByBotToken(ctx, sql.NullString{String: tokenHash, Valid: true})
}

func (r *UserRepository) GetByUsername(ctx context.Context, username string) (dbgen.User, error) {
	return r.db.Queries.GetUserByUsername(ctx, sql.NullString{String: username, Valid: true})
}

func (r *UserRepository) GetByIDs(ctx context.Context, ids []uuid.UUID) ([]dbgen.User, error) {
	return r.db.Queries.GetUsersByIDs(ctx, ids)
}

func (r *UserRepository) GetBotsByOwner(ctx context.Context, ownerID uuid.UUID) ([]dbgen.User, error) {
	return r.db.Queries.GetBotsByOwnerID(ctx, uuid.NullUUID{UUID: ownerID, Valid: true})
}

func (r *UserRepository) CountBotsByOwnerID(ctx context.Context, ownerID uuid.UUID) (int64, error) {
	return r.db.Queries.CountBotsByOwnerID(ctx, uuid.NullUUID{UUID: ownerID, Valid: true})
}

func (r *UserRepository) SearchByUsername(ctx context.Context, query string) ([]dbgen.User, error) {
	return r.db.Queries.SearchUsersByUsername(ctx, query)
}

func (r *UserRepository) GlobalSearch(ctx context.Context, query string) ([]dbgen.User, error) {
	return r.db.Queries.SearchUsersGlobal(ctx, sql.NullString{String: query, Valid: true})
}

func (r *UserRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	return r.db.Queries.UpdateUserStatus(ctx, dbgen.UpdateUserStatusParams{
		ID:     id,
		Status: status,
	})
}

func (r *UserRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.Queries.SoftDeleteUser(ctx, id)
}

func (r *UserRepository) Exists(ctx context.Context, id uuid.UUID) (bool, error) {
	return r.db.Queries.CheckUserExists(ctx, id)
}

func (r *UserRepository) GetSessions(ctx context.Context, userID uuid.UUID) ([]dbgen.Session, error) {
	return r.db.Queries.GetSessionsByUserID(ctx, userID)
}

func (r *UserRepository) TerminateSession(ctx context.Context, sessionID uuid.UUID) error {
	return r.db.Queries.DeactivateSession(ctx, sessionID)
}

func (r *UserRepository) Update(ctx context.Context, params dbgen.UpdateUserParams) (dbgen.User, error) {
	return r.db.Queries.UpdateUser(ctx, params)
}
