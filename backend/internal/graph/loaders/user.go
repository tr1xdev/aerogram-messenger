package loaders

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/graph-gophers/dataloader/v7"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	userpb "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/user/v1"
)

func LoadUser(ctx context.Context, id string) (*dbgen.User, error) {
	l := ForContext(ctx)
	if l == nil {
		return nil, fmt.Errorf("dataloaders not found")
	}
	return l.UserLoader.Load(ctx, strings.ToLower(id))()
}

func newUserBatchFn(client userpb.UserServiceClient) dataloader.BatchFunc[string, *dbgen.User] {
	return func(ctx context.Context, keys []string) []*dataloader.Result[*dbgen.User] {
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
			if uid, err := uuid.Parse(u.Id); err == nil {
				normalizedID := uid.String()
				userMap[normalizedID] = &dbgen.User{
					ID:               uid,
					FirstName:        u.FirstName,
					LastName:         toNullString(u.LastName),
					Username:         toNullString(u.Username),
					PublicKey:        toNullString(u.PublicKey),
					PhotoUrl:         toNullString(u.PhotoUrl),
					EncryptedPrivKey: toNullString(u.EncryptedPrivKey),
					EncryptionIv:     toNullString(u.EncryptionIv),
				}
			}
		}

		for i, id := range keys {
			parsedID, err := uuid.Parse(id)
			if err != nil {
				output[i] = &dataloader.Result[*dbgen.User]{Error: err}
				continue
			}

			if u, ok := userMap[parsedID.String()]; ok {
				output[i] = &dataloader.Result[*dbgen.User]{Data: u}
			} else {
				output[i] = &dataloader.Result[*dbgen.User]{
					Error: fmt.Errorf("user %s not found in user_svc response", id),
				}
			}
		}
		return output
	}
}

func toNullString(s *string) sql.NullString {
	if s == nil {
		return sql.NullString{Valid: false}
	}
	return sql.NullString{String: *s, Valid: true}
}
