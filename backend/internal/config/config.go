package config

import (
	"bytes"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

type Config struct {
	App         AppConfig         `mapstructure:"app"`
	Server      ServerConfig      `mapstructure:"server"`
	Database    DatabaseConfig    `mapstructure:"database"`
	Auth        AuthConfig        `mapstructure:"auth"`
	RateLimit   RateLimitConfig   `mapstructure:"ratelimit"`
	UserService UserServiceConfig `mapstructure:"user_service"`
	S3          S3Config          `mapstructure:"s3"`
}

type AppConfig struct {
	Env       string `mapstructure:"env"`
	TestEmail string `mapstructure:"test_email"`
	Debug     bool   `mapstructure:"debug"`
}

type ServerConfig struct {
	HTTP HTTPConfig `mapstructure:"http"`
	GRPC GRPCConfig `mapstructure:"grpc"`
}

type HTTPConfig struct {
	Host    string        `mapstructure:"host"`
	Port    int           `mapstructure:"port"`
	Timeout TimeoutConfig `mapstructure:"timeout"`
}

type TimeoutConfig struct {
	Read  time.Duration `mapstructure:"read"`
	Write time.Duration `mapstructure:"write"`
	Idle  time.Duration `mapstructure:"idle"`
}

type GRPCConfig struct {
	Host              string        `mapstructure:"host"`
	Port              int           `mapstructure:"port"`
	MaxConnectionIdle time.Duration `mapstructure:"max_connection_idle"`
}

type DatabaseConfig struct {
	Postgres PostgresConfig `mapstructure:"postgres"`
	Redis    RedisConfig    `mapstructure:"redis"`
}

type PostgresConfig struct {
	Host            string        `mapstructure:"host"`
	Port            int           `mapstructure:"port"`
	User            string        `mapstructure:"user"`
	Password        string        `mapstructure:"password"`
	DBName          string        `mapstructure:"dbname"`
	SSLMode         string        `mapstructure:"sslmode"`
	MaxOpenConns    int           `mapstructure:"max_open_conns"`
	MaxIdleConns    int           `mapstructure:"max_idle_conns"`
	ConnMaxLifetime time.Duration `mapstructure:"conn_max_lifetime"`
}

type RedisConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	DB       int    `mapstructure:"db"`
	Password string `mapstructure:"password"`
	PoolSize int    `mapstructure:"pool_size"`
}

type AuthConfig struct {
	JWT   JWTConfig   `mapstructure:"jwt"`
	TwoFA TwoFAConfig `mapstructure:"two_fa"`
}

type JWTConfig struct {
	Secret     string        `mapstructure:"secret"`
	AccessTTL  time.Duration `mapstructure:"access_ttl"`
	RefreshTTL time.Duration `mapstructure:"refresh_ttl"`
}

type TwoFAConfig struct {
	Enabled  bool          `mapstructure:"enabled"`
	OnSignUp bool          `mapstructure:"on_sign_up"`
	OnSignIn bool          `mapstructure:"on_sign_in"`
	CodeTTL  time.Duration `mapstructure:"code_ttl"`
}

type RateLimitConfig struct {
	Global   GlobalLimitConfig   `mapstructure:"global"`
	Auth     AuthLimitConfig     `mapstructure:"auth"`
	Chat     ChatLimitConfig     `mapstructure:"chat"`
	User     UserLimitConfig     `mapstructure:"user"`
	Messages MessagesLimitConfig `mapstructure:"messages"`
}

type GlobalLimitConfig struct {
	Limit int `mapstructure:"limit"`
	Burst int `mapstructure:"burst"`
}

type AuthLimitConfig struct {
	SignUp LimitEntry `mapstructure:"signup"`
	Login  LimitEntry `mapstructure:"login"`
	Verify LimitEntry `mapstructure:"verify"`
}

type ChatLimitConfig struct {
	Create LimitEntry `mapstructure:"create"`
	Delete LimitEntry `mapstructure:"delete"`
}

type UserLimitConfig struct {
	Update    LimitEntry `mapstructure:"update"`
	Search    LimitEntry `mapstructure:"search"`
	CreateBot LimitEntry `mapstructure:"create_bot"`
}

type MessagesLimitConfig struct {
	Send    LimitEntry `mapstructure:"send"`
	History LimitEntry `mapstructure:"history"`
	Update  LimitEntry `mapstructure:"update"`
	Delete  LimitEntry `mapstructure:"delete"`
}

type LimitEntry struct {
	Limit  int           `mapstructure:"limit"`
	Window time.Duration `mapstructure:"window"`
}

type UserServiceConfig struct {
	MaxBotsPerUser int `mapstructure:"max_bots_per_user"`
}

type S3Config struct {
	Endpoint  string `mapstructure:"endpoint"`
	AccessKey string `mapstructure:"access_key"`
	SecretKey string `mapstructure:"secret_key"`
	Bucket    string `mapstructure:"bucket"`
	UseSSL    bool   `mapstructure:"use_ssl"`
	Region    string `mapstructure:"region"`
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

	_ = godotenv.Load()

	content, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config at %s: %w", configPath, err)
	}

	expandedContent := os.Expand(string(content), func(s string) string {
		if strings.Contains(s, ":-") {
			parts := strings.SplitN(s, ":-", 2)
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

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

func (c *Config) PostgresDSN() string {
	p := c.Database.Postgres
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		p.Host, p.Port, p.User, p.Password, p.DBName, p.SSLMode)
}

func (c *Config) RedisAddr() string {
	return fmt.Sprintf("%s:%d", c.Database.Redis.Host, c.Database.Redis.Port)
}
