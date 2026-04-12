package helpers

import (
	"encoding/base64"
	"fmt"
	"strings"
)

func EncodeGlobalID(kind string, id string) string {
	return base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%s:%s", kind, id)))
}

func DecodeGlobalID(globalID string) (string, string, error) {
	decoded, err := base64.StdEncoding.DecodeString(globalID)
	if err != nil {
		return "", "", err
	}
	parts := strings.SplitN(string(decoded), ":", 2)
	if len(parts) != 2 {
		return "", "", fmt.Errorf("invalid global id format")
	}
	return parts[0], parts[1], nil
}

func ToRawID(id string) string {
	_, raw, err := DecodeGlobalID(id)
	if err != nil {
		return id
	}
	return raw
}
