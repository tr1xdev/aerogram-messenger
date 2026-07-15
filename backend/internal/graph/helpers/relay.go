package helpers

import (
	"encoding/base64"
	"fmt"
	"strings"
)

func EncodeGlobalID(kind string, id string) string {
	return base64.StdEncoding.EncodeToString(fmt.Appendf(nil, "%s:%s", kind, id))
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
	if id == "" {
		return ""
	}

	decoded, err := base64.StdEncoding.DecodeString(id)
	if err != nil {
		return extractID(id)
	}

	strDecoded := string(decoded)
	if strings.Contains(strDecoded, ":") {
		return extractID(strDecoded)
	}

	return id
}

func extractID(s string) string {
	parts := strings.SplitN(s, ":", 2)
	if len(parts) == 2 {
		return parts[1]
	}
	return s
}
