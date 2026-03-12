package database

import (
	"database/sql"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"testing"
	"time"

	"github.com/google/uuid"
	_ "github.com/jackc/pgx/v5/stdlib"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
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

	_, filename, _, _ := runtime.Caller(0)
	migrationsDir := filepath.Join(filepath.Dir(filename), "sqlc", "migrations")

	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		t.Fatalf("failed to read migrations: %v", err)
	}

	var filenames []string
	for _, f := range files {
		if !f.IsDir() && filepath.Ext(f.Name()) == ".sql" {
			filenames = append(filenames, f.Name())
		}
	}
	sort.Strings(filenames)

	for _, name := range filenames {
		content, err := os.ReadFile(filepath.Join(migrationsDir, name))
		if err != nil {
			t.Fatalf("failed to read migration %s: %v", name, err)
		}

		if _, err := db.Exec(string(content)); err != nil {
			t.Fatalf("failed migration %s: %v", name, err)
		}
	}

	return &DB{
		Conn:    db,
		Queries: dbgen.New(db),
	}
}

func getProjectRoot() string {
	_, filename, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(filename), "../..")
}
