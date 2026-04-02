package middleware

import (
	"net/http"

	"github.com/go-chi/cors"
)

func Cors() func(http.Handler) http.Handler {
	return cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"https://localhost:3443",
			"https://localhost:3000",
			"http://localhost:3000",
			"http://localhost:5173",
			"https://localhost:5173",
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Apollo-Operation-Name", "Apollo-Require-Preflight", "Upgrade", "Connection"},
		AllowCredentials: true,
	})
}
