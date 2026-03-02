package graph

import (
	"context"
	"fmt"
	"net/http"

	userpb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/user/v1"
	"github.com/aerogram-org/aerogram-api/internal/models"
	"github.com/aerogram-org/aerogram-api/internal/repositories"
	"github.com/graph-gophers/dataloader/v7"
)

type loaderCtxKey string

const loadersKey loaderCtxKey = "dataloaders"

type Loaders struct {
	UserLoader     *dataloader.Loader[string, *models.User]
	PresenceLoader *dataloader.Loader[string, string]
}

func LoaderMiddleware(client userpb.UserServiceClient, pRepo *repositories.PresenceRepository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userBatchFn := func(ctx context.Context, keys []string) []*dataloader.Result[*models.User] {
				res, err := client.GetUsers(ctx, &userpb.GetUsersRequest{Ids: keys})
				output := make([]*dataloader.Result[*models.User], len(keys))
				if err != nil {
					for i := range output {
						output[i] = &dataloader.Result[*models.User]{Error: err}
					}
					return output
				}

				userMap := make(map[string]*models.User)
				for _, u := range res.Users {
					var pubKey *string
					if u.PublicKey != nil {
						pubKey = u.PublicKey
					}

					userMap[u.Id] = &models.User{
						ID:        u.Id,
						FirstName: u.FirstName,
						LastName:  u.GetLastName(),
						Username:  u.GetUsername(),
						Email:     u.GetEmail(),
						PublicKey: pubKey,
					}
				}

				for i, id := range keys {
					if u, ok := userMap[id]; ok {
						output[i] = &dataloader.Result[*models.User]{Data: u}
					} else {
						output[i] = &dataloader.Result[*models.User]{Error: fmt.Errorf("user %s not found", id)}
					}
				}
				return output
			}

			presenceBatchFn := func(ctx context.Context, keys []string) []*dataloader.Result[string] {
				res, err := pRepo.GetStatuses(ctx, keys)
				output := make([]*dataloader.Result[string], len(keys))
				if err != nil {
					for i := range output {
						output[i] = &dataloader.Result[string]{Error: err}
					}
					return output
				}
				for i, id := range keys {
					status := "offline"
					if s, ok := res[id]; ok {
						status = s
					}
					output[i] = &dataloader.Result[string]{Data: status}
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

func LoadUser(ctx context.Context, id string) (*models.User, error) {
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
