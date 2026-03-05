package graph

import (
	"context"
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/graph-gophers/dataloader/v7"
	userpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/user/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/models"
	"github.com/tr1xdev/aerogram-messenger/internal/repositories"
)

type loaderCtxKey string

const loadersKey loaderCtxKey = "dataloaders"

type Loaders struct {
	UserLoader     *dataloader.Loader[uuid.UUID, *models.User]
	PresenceLoader *dataloader.Loader[uuid.UUID, string]
}

func LoaderMiddleware(client userpb.UserServiceClient, pRepo *repositories.PresenceRepository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userBatchFn := func(ctx context.Context, keys []uuid.UUID) []*dataloader.Result[*models.User] {
				stringKeys := make([]string, len(keys))
				for i, k := range keys {
					stringKeys[i] = k.String()
				}

				res, err := client.GetUsers(ctx, &userpb.GetUsersRequest{Ids: stringKeys})
				output := make([]*dataloader.Result[*models.User], len(keys))
				if err != nil {
					for i := range output {
						output[i] = &dataloader.Result[*models.User]{Error: err}
					}
					return output
				}

				userMap := make(map[uuid.UUID]*models.User)
				for _, u := range res.Users {
					uid, _ := uuid.Parse(u.Id)
					userMap[uid] = &models.User{
						ID:               uid,
						FirstName:        u.FirstName,
						LastName:         u.LastName,
						Username:         u.Username,
						Email:            u.GetEmail(),
						PublicKey:        u.PublicKey,
						EncryptedPrivKey: u.EncryptedPrivKey,
						EncryptionIv:     u.EncryptionIv,
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

			presenceBatchFn := func(ctx context.Context, keys []uuid.UUID) []*dataloader.Result[string] {
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
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, err
	}
	return loaders.UserLoader.Load(ctx, uid)()
}

func LoadPresence(ctx context.Context, id string) (string, error) {
	loaders, ok := ctx.Value(loadersKey).(*Loaders)
	if !ok {
		return "offline", nil
	}
	uid, err := uuid.Parse(id)
	if err != nil {
		return "offline", nil
	}
	return loaders.PresenceLoader.Load(ctx, uid)()
}
