package graph

import (
	"context"
	"fmt"
	"net/http"

	userpb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/user/v1"
	"github.com/aerogram-org/aerogram-api/internal/models"
	"github.com/graph-gophers/dataloader/v7"
)

type contextKey string

const loadersKey contextKey = "dataloaders"

func LoaderMiddleware(client userpb.UserServiceClient) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			batchFn := func(ctx context.Context, keys []string) []*dataloader.Result[*models.User] {
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
					userMap[u.Id] = &models.User{
						ID:        u.Id,
						FirstName: u.FirstName,
						LastName:  u.GetLastName(),
						Username:  u.GetUsername(),
						Email:     u.GetEmail(),
					}
				}

				for i, id := range keys {
					if u, ok := userMap[id]; ok {
						output[i] = &dataloader.Result[*models.User]{Data: u}
					} else {
						output[i] = &dataloader.Result[*models.User]{
							Error: fmt.Errorf("user %s not found", id),
						}
					}
				}
				return output
			}

			loader := dataloader.NewBatchedLoader(batchFn)
			ctx := context.WithValue(r.Context(), loadersKey, loader)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func LoadUser(ctx context.Context, id string) (*models.User, error) {
	val := ctx.Value(loadersKey)
	if val == nil {
		return nil, fmt.Errorf("dataloader not found in context")
	}

	loader := val.(*dataloader.Loader[string, *models.User])
	return loader.Load(ctx, id)()
}
