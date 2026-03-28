package config

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

type Config struct {
	App      AppConfig
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	Resend   ResendConfig
}

type AppConfig struct {
	Env       string
	TestEmail string
}

type ServerConfig struct {
	HTTP HTTPConfig
	GRPC GRPCConfig
}

type HTTPConfig struct {
	Host string
	Port int
}

type GRPCConfig struct {
	Host string
	Port int
}

type DatabaseConfig struct {
	Postgres PostgresConfig
	Redis    RedisConfig
}

type PostgresConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type RedisConfig struct {
	Host     string
	Port     int
	Password string
	DB       int
}

type JWTConfig struct {
	Secret     string
	TTLMinutes int
}

type ResendConfig struct {
	Token string
	From  string
}

func Load() (*Config, error) {
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		locations := []string{"config.yaml", "config/config.yaml", "../config.yaml"}
		for _, loc := range locations {
			if _, err := os.Stat(loc); err == nil {
				configPath = loc
				break
			}
		}
	}

	if configPath == "" {
		return nil, fmt.Errorf("config file not found")
	}

	configDir := filepath.Dir(configPath)
	_ = godotenv.Load(filepath.Join(configDir, ".env"))
	_ = godotenv.Load()

	content, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config at %s: %w", configPath, err)
	}

	expandedContent := os.Expand(string(content), func(s string) string {
		if strings.Contains(s, ":-") {
			parts := strings.Split(s, ":-")
			if val := os.Getenv(parts[0]); val != "" {
				return val
			}
			return parts[1]
		}
		return os.Getenv(s)
	})

	viper.SetConfigType("yaml")
	if err := viper.ReadConfig(bytes.NewBufferString(expandedContent)); err != nil {
		return nil, err
	}

	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	cfg.App.Env = os.Getenv("APP_ENV")
	if cfg.App.Env == "" {
		cfg.App.Env = viper.GetString("app.env")
	}
	cfg.App.TestEmail = os.Getenv("TEST_EMAIL")
	cfg.Database.Postgres.Password = os.Getenv("POSTGRES_PASSWORD")
	cfg.Database.Redis.Password = os.Getenv("REDIS_PASSWORD")
	cfg.JWT.Secret = os.Getenv("JWT_SECRET")

	cfg.Resend.Token = os.Getenv("RESEND_TOKEN")
	cfg.Resend.From = viper.GetString("resend.from")

	return &cfg, nil
}

func (c *Config) PostgresDSN() string {
	p := c.Database.Postgres
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		p.Host, p.Port, p.User, p.Password, p.DBName, p.SSLMode)
}

func (c *Config) RedisAddr() string {
	r := c.Database.Redis
	return fmt.Sprintf("%s:%d", r.Host, r.Port)
}

func (c *Config) RedisPassword() string {
	return c.Database.Redis.Password
}

func (j JWTConfig) TTL() time.Duration {
	return time.Duration(j.TTLMinutes) * time.Minute
}
