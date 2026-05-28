package api

import (
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/middleware"
)

func (c *RouterConfig) HandleGetAttachment(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	userIDStr := middleware.GetUserID(ctx)
	if userIDStr == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user token context", http.StatusBadRequest)
		return
	}

	fileKey := chi.URLParam(r, "*")
	if fileKey == "" {
		http.Error(w, "Empty file key", http.StatusBadRequest)
		return
	}

	if strings.Contains(fileKey, "..") {
		http.Error(w, "Directory traversal detected", http.StatusBadRequest)
		return
	}

	fileKey = strings.TrimPrefix(fileKey, "/")

	var fullStoragePath string
	if strings.HasPrefix(fileKey, "attachments/") {
		fullStoragePath = fileKey
	} else {
		fullStoragePath = "attachments/" + fileKey
	}

	hasAccess, err := c.DB.Queries.CheckFileAccess(ctx, dbgen.CheckFileAccessParams{
		FileName: fullStoragePath,
		UserID:   userID,
	})
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if !hasAccess {
		http.Error(w, "Access denied to this resource", http.StatusForbidden)
		return
	}

	presignedURL, err := c.Storage.GetPresignedURL(ctx, fullStoragePath, time.Minute*2)
	if err != nil {
		http.Error(w, "Failed to generate download payload", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Cache-Control", "private, no-cache, no-store, must-revalidate")
	http.Redirect(w, r, presignedURL, http.StatusTemporaryRedirect)
}
