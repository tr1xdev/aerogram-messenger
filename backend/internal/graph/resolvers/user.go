package resolvers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/graph"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/helpers"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/loaders"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/model"
	"github.com/tr1xdev/aerogram-messenger/internal/middleware"
)

func (r *mutationResolver) UpdateUser(ctx context.Context, input model.UpdateUserInput) (*dbgen.User, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, errors.New("unauthorized access")
	}
	uid, err := uuid.Parse(authID)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	_, err = r.Store.UpdateUser(ctx, dbgen.UpdateUserParams{
		ID:               uid,
		FirstName:        helpers.ToNullString(input.FirstName),
		LastName:         helpers.ToNullString(input.LastName),
		Username:         helpers.ToNullString(input.Username),
		PublicKey:        helpers.ToNullString(input.PublicKey),
		EncryptedPrivKey: helpers.ToNullString(input.EncryptedPrivKey),
		EncryptionIv:     helpers.ToNullString(input.EncryptionIv),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to update profile: %w", err)
	}

	return loaders.LoadUser(ctx, authID)
}

func (r *queryResolver) Me(ctx context.Context) (*dbgen.User, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, errors.New("unauthorized")
	}

	return loaders.LoadUser(ctx, authID)
}

func (r *queryResolver) User(ctx context.Context, id string) (*dbgen.User, error) {
	return loaders.LoadUser(ctx, id)
}

func (r *queryResolver) GetUser(ctx context.Context, id string) (*dbgen.User, error) {
	return loaders.LoadUser(ctx, id)
}

func (r *queryResolver) SearchUsers(ctx context.Context, username string) ([]*dbgen.User, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, errors.New("unauthorized")
	}

	if len(username) < 3 {
		return []*dbgen.User{}, nil
	}

	users, err := r.Store.SearchUsersByUsername(ctx, "%"+strings.ToLower(username)+"%")
	if err != nil {
		return nil, err
	}

	limit := 20
	if len(users) > limit {
		users = users[:limit]
	}

	result := make([]*dbgen.User, len(users))
	for i := range users {
		result[i] = &users[i]
	}
	return result, nil
}

func (r *subscriptionResolver) UserStatusChanged(ctx context.Context, chatID string) (<-chan *model.UserStatusPayload, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, errors.New("unauthorized")
	}

	statusChan := make(chan *model.UserStatusPayload, 1)
	pubsub := r.RedisClient.Subscribe(ctx, "presence:updates")

	go func() {
		defer pubsub.Close()
		defer close(statusChan)

		for {
			select {
			case <-ctx.Done():
				return
			case msg, ok := <-pubsub.Channel():
				if !ok {
					return
				}

				var data struct {
					UserID   string `json:"userId"`
					Status   string `json:"status"`
					LastSeen string `json:"lastSeen"`
				}

				if err := json.Unmarshal([]byte(msg.Payload), &data); err != nil {
					continue
				}

				select {
				case statusChan <- &model.UserStatusPayload{
					UserID:   data.UserID,
					Status:   data.Status,
					LastSeen: &data.LastSeen,
				}:
				case <-ctx.Done():
					return
				}
			}
		}
	}()

	return statusChan, nil
}

func (r *userResolver) ID(ctx context.Context, obj *dbgen.User) (string, error) {
	return obj.ID.String(), nil
}

func (r *userResolver) Email(ctx context.Context, obj *dbgen.User) (string, error) {
	return obj.Email, nil
}

func (r *userResolver) FirstName(ctx context.Context, obj *dbgen.User) (string, error) {
	return obj.FirstName, nil
}

func (r *userResolver) LastName(ctx context.Context, obj *dbgen.User) (*string, error) {
	return helpers.ToStringPtr(obj.LastName), nil
}

func (r *userResolver) DisplayName(ctx context.Context, obj *dbgen.User) (*string, error) {
	name := obj.FirstName
	if obj.LastName.Valid && obj.LastName.String != "" {
		name += " " + obj.LastName.String
	}
	return &name, nil
}

func (r *userResolver) Username(ctx context.Context, obj *dbgen.User) (*string, error) {
	return helpers.ToStringPtr(obj.Username), nil
}

func (r *userResolver) PhotoURL(ctx context.Context, obj *dbgen.User) (*string, error) {
	return nil, nil
}

func (r *userResolver) Bio(ctx context.Context, obj *dbgen.User) (*string, error) {
	return nil, nil
}

func (r *userResolver) Status(ctx context.Context, obj *dbgen.User) (string, error) {
	return loaders.LoadPresence(ctx, obj.ID.String())
}

func (r *userResolver) IsVerified(ctx context.Context, obj *dbgen.User) (bool, error) {
	return false, nil
}

func (r *userResolver) PublicKey(ctx context.Context, obj *dbgen.User) (*string, error) {
	return helpers.ToStringPtr(obj.PublicKey), nil
}

func (r *userResolver) EncryptedPrivKey(ctx context.Context, obj *dbgen.User) (*string, error) {
	return helpers.ToStringPtr(obj.EncryptedPrivKey), nil
}

func (r *userResolver) EncryptionIv(ctx context.Context, obj *dbgen.User) (*string, error) {
	return helpers.ToStringPtr(obj.EncryptionIv), nil
}

func (r *Resolver) User() graph.UserResolver { return &userResolver{r} }

type userResolver struct{ *Resolver }
