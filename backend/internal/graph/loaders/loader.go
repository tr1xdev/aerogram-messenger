package loaders

import (
	"context"
	"net/http"

	"github.com/graph-gophers/dataloader/v7"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/model"
	presencepb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/presence/v1"
	userpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/user/v1"
)

type loaderCtxKey string

const loadersKey loaderCtxKey = "dataloaders"

type Loaders struct {
	UserLoader     *dataloader.Loader[string, *dbgen.User]
	PresenceLoader *dataloader.Loader[string, string]
	MessageLoader  *dataloader.Loader[string, *model.Message]
}

func NewLoaders(userClient userpb.UserServiceClient, presenceClient presencepb.PresenceServiceClient, store *dbgen.Queries) *Loaders {
	return &Loaders{
		UserLoader: dataloader.NewBatchedLoader(newUserBatchFn(userClient)),
		PresenceLoader: dataloader.NewBatchedLoader(
			newPresenceBatchFn(presenceClient),
			dataloader.WithCache[string, string](&dataloader.NoCache[string, string]{}),
		),
		MessageLoader: dataloader.NewBatchedLoader(newMessageBatchFn(store)),
	}
}

func LoaderMiddleware(userClient userpb.UserServiceClient, presenceClient presencepb.PresenceServiceClient, store *dbgen.Queries) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			l := NewLoaders(userClient, presenceClient, store)
			ctx := AttachToContext(r.Context(), l)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func AttachToContext(ctx context.Context, l *Loaders) context.Context {
	return context.WithValue(ctx, loadersKey, l)
}

func ForContext(ctx context.Context) *Loaders {
	l, _ := ctx.Value(loadersKey).(*Loaders)
	return l
}
