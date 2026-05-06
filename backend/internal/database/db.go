package database

import (
	"database/sql"
	"embed"
	"fmt"
	"os"
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
	d, err := iofs.New(migrationsFS, "sqlc/migrations")
	if err != nil {
		return fmt.Errorf("iofs error: %w", err)
	}

	driver, err := pgx.WithInstance(db.Conn, &pgx.Config{})
	if err != nil {
		return fmt.Errorf("driver error: %w", err)
	}

	m, err := migrate.NewWithInstance("iofs", d, "pgx", driver)
	if err != nil {
		return fmt.Errorf("migrate instance error: %w", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("migration up error: %w", err)
	}

	return nil
}

func (db *DB) Close() error {
	return db.Conn.Close()
}

func SetupTestDB(t *testing.T) *DB {
	user := os.Getenv("DB_USER")
	if user == "" {
		user = "admin"
	}
	pass := os.Getenv("POSTGRES_PASSWORD")
	if pass == "" {
		pass = "admin"
	}
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "aerogram_test"
	}

	dsn := fmt.Sprintf("postgres://%s:%s@%s:5432/%s?sslmode=disable", user, pass, host, dbName)

	inst, err := NewPostgres(dsn)
	if err != nil {
		t.Fatalf("failed to init db instance: %v", err)
	}

	if err := inst.RunMigrations(); err != nil {
		t.Fatalf("failed to run test migrations: %v", err)
	}

	inst.TruncateTables(t)

	return inst
}

func (db *DB) TruncateTables(t *testing.T) {
	t.Helper()
	_, err := db.Conn.Exec(`
		DO $$
		DECLARE
			r RECORD;
		BEGIN
			FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'schema_migrations') LOOP
				EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
			END LOOP;
		END $$;
	`)
	if err != nil {
		t.Fatalf("failed to truncate tables: %v", err)
	}
}

func SetupGlobalTestDB() (*DB, func()) {
	user := os.Getenv("DB_USER")
	if user == "" {
		user = "admin"
	}
	pass := os.Getenv("POSTGRES_PASSWORD")
	if pass == "" {
		pass = "admin"
	}
	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "aerogram_test"
	}

	dsn := fmt.Sprintf("postgres://%s:%s@%s:5432/%s?sslmode=disable", user, pass, host, dbName)

	db, err := NewPostgres(dsn)
	if err != nil {
		panic(fmt.Sprintf("failed to init global test db: %v", err))
	}

	if err := db.RunMigrations(); err != nil {
		panic(fmt.Sprintf("failed to run global test migrations: %v", err))
	}

	cleanup := func() {
		db.Close()
	}

	return db, cleanup
}

func StringToNullString(s string) sql.NullString {
	return sql.NullString{String: s, Valid: s != ""}
}

func UUIDToNullUUID(id uuid.UUID) uuid.NullUUID {
	return uuid.NullUUID{UUID: id, Valid: id != uuid.Nil}
}

func ToNullUUID(s string) uuid.NullUUID {
	uid, err := uuid.Parse(s)
	return uuid.NullUUID{UUID: uid, Valid: err == nil}
}

func ToNullUUIDPtr(s *string) uuid.NullUUID {
	if s == nil {
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

func TimeToNullTime(t time.Time) sql.NullTime {
	return sql.NullTime{Time: t, Valid: !t.IsZero()}
}

func ToNullTime(t *time.Time) sql.NullTime {
	if t == nil {
		return sql.NullTime{Valid: false}
	}
	return sql.NullTime{Time: *t, Valid: true}
}

func ToNullInt32(i *int32) sql.NullInt32 {
	if i == nil {
		return sql.NullInt32{Valid: false}
	}
	return sql.NullInt32{Int32: *i, Valid: true}
}
