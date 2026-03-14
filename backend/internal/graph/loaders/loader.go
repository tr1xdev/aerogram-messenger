package loaders

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/graph-gophers/dataloader/v7"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	userpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/user/v1"
)

type loaderCtxKey string

const loadersKey loaderCtxKey = "dataloaders"

type Loaders struct {
	UserLoader     *dataloader.Loader[string, *dbgen.User]
	PresenceLoader *dataloader.Loader[string, string]
}

func LoaderMiddleware(client userpb.UserServiceClient) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userBatchFn := func(ctx context.Context, keys []string) []*dataloader.Result[*dbgen.User] {
				res, err := client.GetUsers(ctx, &userpb.GetUsersRequest{Ids: keys})
				output := make([]*dataloader.Result[*dbgen.User], len(keys))

				if err != nil {
					for i := range output {
						output[i] = &dataloader.Result[*dbgen.User]{Error: err}
					}
					return output
				}

				userMap := make(map[string]*dbgen.User)
				for _, u := range res.Users {
					uid, _ := uuid.Parse(u.Id)
					userMap[u.Id] = &dbgen.User{
						ID:               uid,
						FirstName:        u.FirstName,
						LastName:         toNullString(u.LastName),
						Username:         toNullString(u.Username),
						PublicKey:        toNullString(u.PublicKey),
						EncryptedPrivKey: toNullString(u.EncryptedPrivKey),
						EncryptionIv:     toNullString(u.EncryptionIv),
					}
				}

				for i, id := range keys {
					if u, ok := userMap[id]; ok {
						output[i] = &dataloader.Result[*dbgen.User]{Data: u}
					} else {
						output[i] = &dataloader.Result[*dbgen.User]{Error: fmt.Errorf("user %s not found", id)}
					}
				}
				return output
			}

			presenceBatchFn := func(ctx context.Context, keys []string) []*dataloader.Result[string] {
				output := make([]*dataloader.Result[string], len(keys))
				for i := range keys {
					output[i] = &dataloader.Result[string]{Data: "offline"}
				}
				return output
			}

			loaders := &Loaders{
				UserLoader:     dataloader.NewBatchedLoader(userBatchFn),
				PresenceLoader: dataloader.NewBatchedLoader(presenceBatchFn),
			}

			ctx := context.WithValue(r.Context(), loadersKey, loaders)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func LoadUser(ctx context.Context, id string) (*dbgen.User, error) {
	loaders, ok := ctx.Value(loadersKey).(*Loaders)
	if !ok {
		return nil, fmt.Errorf("dataloaders not found")
	}
	thunk := loaders.UserLoader.Load(ctx, id)
	return thunk()
}

func LoadPresence(ctx context.Context, id string) (string, error) {
	loaders, ok := ctx.Value(loadersKey).(*Loaders)
	if !ok {
		return "offline", nil
	}
	thunk := loaders.PresenceLoader.Load(ctx, id)
	return thunk()
}

func toNullString(s *string) sql.NullString {
	if s == nil {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: *s, Valid: true}
}
