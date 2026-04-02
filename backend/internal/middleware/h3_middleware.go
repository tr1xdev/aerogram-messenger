package middleware

import (
	"fmt"
	"net/http"
)

func H3AltSvc(port int) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Alt-Svc", fmt.Sprintf(`h3=":%d"; ma=86400`, port))
			next.ServeHTTP(w, r)
		})
	}
}
