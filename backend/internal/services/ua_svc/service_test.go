package ua_svc

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParse(t *testing.T) {
	svc := New()

	tests := []struct {
		name     string
		ua       string
		expected string
	}{
		{
			name:     "empty_ua",
			ua:       "",
			expected: "Unknown Device",
		},
		{
			name:     "iphone_safari",
			ua:       "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
			expected: "iPhone (iOS)",
		},
		{
			name:     "android_chrome",
			ua:       "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
			expected: "Pixel 7 (Android)",
		},
		{
			name:     "desktop_mac_chrome",
			ua:       "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
			expected: "Mac (Mac OS X)",
		},
		{
			name:     "google_bot",
			ua:       "Googlebot/2.1 (+http://www.google.com/bot.html)",
			expected: "Spider",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := svc.Parse(tt.ua)
			assert.Equal(t, tt.expected, result)
		})
	}
}
