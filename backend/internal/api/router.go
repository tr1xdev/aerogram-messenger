package api

import (
	"net/http"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/go-chi/chi/v5"
)

func SetupRoutes(r *chi.Mux, srv *handler.Server) {
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Alt-Svc", `h3=":8080"; ma=86400`)
			next.ServeHTTP(w, r)
		})
	})

	r.Handle("/", playground.Handler("GraphQL playground", "/query"))
	r.Handle("/query", srv)
}
