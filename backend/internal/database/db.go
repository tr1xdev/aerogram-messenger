package database

import (
	"context"
	"database/sql"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/tr1xdev/aerogram-messenger/internal/database/sqlc"
)

type DB struct {
	Conn    *sql.DB
	Queries *dbgen.Queries
}

func NewPostgres(dsn string) (*DB, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return &DB{
		Conn:    db,
		Queries: dbgen.New(db),
	}, nil
}

func (db *DB) Close() error {
	return db.Conn.Close()
}
