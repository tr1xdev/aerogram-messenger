package database

import (
	"database/sql"
	"embed"
	"fmt"
	"io/fs"
	"testing"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/google/uuid"
	_ "github.com/jackc/pgx/v5/stdlib"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
)

//go:embed sqlc/migrations/*.sql
var migrationsFS embed.FS

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

func (db *DB) RunMigrations() error {
	subFS, err := fs.Sub(migrationsFS, "sqlc/migrations")
	if err != nil {
		return fmt.Errorf("failed to create subfs: %w", err)
	}

	d, err := iofs.New(subFS, ".")
	if err != nil {
		return err
	}

	driver, err := pgx.WithInstance(db.Conn, &pgx.Config{})
	if err != nil {
		return err
	}

	m, err := migrate.NewWithInstance("iofs", d, "pgx", driver)
	if err != nil {
		return err
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return err
	}

	return nil
}

func (db *DB) Close() error {
	return db.Conn.Close()
}

func StringToNullString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: s, Valid: true}
}

func UUIDToNullUUID(id uuid.UUID) uuid.NullUUID {
	return uuid.NullUUID{
		UUID:  id,
		Valid: id != uuid.Nil,
	}
}

func ToNullUUID(s string) uuid.NullUUID {
	uid, err := uuid.Parse(s)
	if err != nil {
		return uuid.NullUUID{Valid: false}
	}
	return uuid.NullUUID{UUID: uid, Valid: true}
}

func ToNullUUIDPtr(s *string) uuid.NullUUID {
	if s == nil || *s == "" {
		return uuid.NullUUID{Valid: false}
	}
	return ToNullUUID(*s)
}

func ToNullString(s *string) sql.NullString {
	if s == nil {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: *s, Valid: true}
}

func ToNullTime(t *time.Time) sql.NullTime {
	if t == nil {
		return sql.NullTime{Valid: false}
	}
	return sql.NullTime{Time: *t, Valid: true}
}

func TimeToNullTime(t time.Time) sql.NullTime {
	if t.IsZero() {
		return sql.NullTime{Valid: false}
	}
	return sql.NullTime{
		Time:  t,
		Valid: true,
	}
}

func ToNullTimePtr(t *time.Time) sql.NullTime {
	if t == nil {
		return sql.NullTime{Valid: false}
	}
	return sql.NullTime{Time: *t, Valid: true}
}

func UUIDToNullUUIDPtr(id *uuid.UUID) uuid.NullUUID {
	if id == nil {
		return uuid.NullUUID{Valid: false}
	}
	return uuid.NullUUID{UUID: *id, Valid: true}
}

func SetupTestDB(t *testing.T) *DB {
	dsn := "postgres://postgres:postgres@localhost:5432/aerogram_test?sslmode=disable"

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatalf("failed to connect to test db: %v", err)
	}

	_, err = db.Exec(`
		SET client_min_messages TO WARNING;
		DROP SCHEMA IF EXISTS public CASCADE;
		CREATE SCHEMA public;
		GRANT ALL ON SCHEMA public TO postgres;
		GRANT ALL ON SCHEMA public TO public;
	`)
	if err != nil {
		t.Fatalf("failed to reset schema: %v", err)
	}

	inst, err := NewPostgres(dsn)
	if err != nil {
		t.Fatalf("failed to init db instance: %v", err)
	}

	if err := inst.RunMigrations(); err != nil {
		t.Fatalf("failed to run test migrations: %v", err)
	}

	return inst
}

func (db *DB) TruncateTables(t *testing.T) {
	_, err := db.Conn.Exec(`
		DO $$
		DECLARE
			r RECORD;
		BEGIN
			FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'schema_migrations') LOOP
				EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
			END LOOP;
		END $$;
	`)
	if err != nil {
		t.Fatalf("failed to truncate tables: %v", err)
	}
}
