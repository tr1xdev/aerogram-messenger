package config

import (
	"bytes"
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"github.com/mitchellh/mapstructure"
	"github.com/spf13/viper"
)

var defaultConfigLocations = []string{
	"config.yaml",
	"config/config.yaml",
	"../config.yaml",
}

func Load() (*Config, error) {
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		return nil, fmt.Errorf("failed to load .env: %w", err)
	}

	path, err := resolveConfigPath()
	if err != nil {
		return nil, err
	}

	content, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config at %s: %w", path, err)
	}

	expanded := expandEnv(string(content))

	v := viper.New()
	v.SetConfigType("yaml")
	if err := v.ReadConfig(bytes.NewBufferString(expanded)); err != nil {
		return nil, fmt.Errorf("failed to parse config at %s: %w", path, err)
	}

	var cfg Config
	if err := decodeStrict(v, &cfg); err != nil {
		return nil, fmt.Errorf("failed to decode config at %s: %w", path, err)
	}

	return &cfg, nil
}

func MustLoad() *Config {
	cfg, err := Load()
	if err != nil {
		panic(err)
	}
	if err := cfg.Validate(); err != nil {
		panic(err)
	}
	return cfg
}

func resolveConfigPath() (string, error) {
	if path := os.Getenv("CONFIG_PATH"); path != "" {
		if _, err := os.Stat(path); err != nil {
			return "", fmt.Errorf("CONFIG_PATH is set to %q but the file cannot be accessed: %w", path, err)
		}
		return path, nil
	}

	for _, loc := range defaultConfigLocations {
		if _, err := os.Stat(loc); err == nil {
			return loc, nil
		}
	}

	return "", fmt.Errorf("config file not found, checked: %s", strings.Join(defaultConfigLocations, ", "))
}

func expandEnv(content string) string {
	return os.Expand(content, func(key string) string {
		if before, after, ok := strings.Cut(key, ":-"); ok {
			name, fallback := before, after
			if val := os.Getenv(name); val != "" {
				return val
			}
			return fallback
		}
		return os.Getenv(key)
	})
}

func decodeStrict(v *viper.Viper, cfg *Config) error {
	decoder, err := mapstructure.NewDecoder(&mapstructure.DecoderConfig{
		Metadata:         nil,
		Result:           cfg,
		WeaklyTypedInput: true,
		ErrorUnused:      true,
		DecodeHook: mapstructure.ComposeDecodeHookFunc(
			mapstructure.StringToTimeDurationHookFunc(),
			mapstructure.StringToSliceHookFunc(","),
		),
	})
	if err != nil {
		return err
	}
	return decoder.Decode(v.AllSettings())
}
