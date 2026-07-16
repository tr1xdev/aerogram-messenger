package config

import (
	"fmt"
	"strings"
)

type validationErrors []string

func (c *Config) Validate() error {
	var errs validationErrors

	check := func(cond bool, msg string) {
		if cond {
			errs = append(errs, msg)
		}
	}

	check(c.App.Env == "", "app.env is required")

	check(c.Server.HTTP.Port == 0, "server.http.port is required")
	check(c.Server.GRPC.Port == 0, "server.grpc.port is required")
	check(c.Server.HTTP.Port != 0 && c.Server.HTTP.Port == c.Server.GRPC.Port,
		"server.http.port and server.grpc.port must differ")

	check(c.Database.Postgres.Host == "", "database.postgres.host is required")
	check(c.Database.Postgres.Port == 0, "database.postgres.port is required")
	check(c.Database.Postgres.User == "", "database.postgres.user is required")
	check(c.Database.Postgres.DBName == "", "database.postgres.dbname is required")

	check(c.Database.Redis.Host == "", "database.redis.host is required")
	check(c.Database.Redis.Port == 0, "database.redis.port is required")

	check(c.Auth.JWT.Secret == "", "auth.jwt.secret is required")
	check(len(c.Auth.JWT.Secret) > 0 && len(c.Auth.JWT.Secret) < 32,
		"auth.jwt.secret should be at least 32 characters")
	check(c.Auth.JWT.AccessTTL <= 0, "auth.jwt.access_ttl must be > 0")
	check(c.Auth.JWT.RefreshTTL <= 0, "auth.jwt.refresh_ttl must be > 0")
	check(c.Auth.JWT.RefreshTTL > 0 && c.Auth.JWT.AccessTTL > 0 && c.Auth.JWT.RefreshTTL <= c.Auth.JWT.AccessTTL,
		"auth.jwt.refresh_ttl should be greater than access_ttl")

	if c.Auth.TwoFA.Enabled {
		check(c.Auth.TwoFA.CodeTTL <= 0, "auth.two_fa.code_ttl must be > 0 when two_fa is enabled")
	}

	check(c.S3.Endpoint == "", "s3.endpoint is required")
	check(c.S3.Bucket == "", "s3.bucket is required")
	check(c.S3.AccessKey == "", "s3.access_key is required")
	check(c.S3.SecretKey == "", "s3.secret_key is required")

	if c.App.IsProduction() {
		check(c.App.Debug, "app.debug must be false in production")
		check(c.Database.Postgres.Password == "", "database.postgres.password is required in production")
		check(c.Database.Postgres.SSLMode == "" || c.Database.Postgres.SSLMode == "disable",
			"database.postgres.sslmode must not be disabled in production")
		check(!c.S3.UseSSL, "s3.use_ssl must be true in production")
		check(c.S3.PublicHost == "", "s3.public_host is required in production")
	}

	if len(errs) > 0 {
		return errs
	}
	return nil
}

func (e validationErrors) Error() string {
	return fmt.Sprintf("invalid config:\n  - %s", strings.Join(e, "\n  - "))
}
