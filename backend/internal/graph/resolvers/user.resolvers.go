package resolvers

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/sqlc-dev/pqtype"
	"github.com/tr1xdev/aerogram-messenger/internal/database"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/graph"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/helpers"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/loaders"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/model"
	authv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/auth/v1"
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

	params := dbgen.UpdateUserParams{
		ID:               uid,
		FirstName:        helpers.ToNullString(input.FirstName),
		LastName:         helpers.ToNullString(input.LastName),
		Username:         helpers.ToNullString(input.Username),
		PublicKey:        helpers.ToNullString(input.PublicKey),
		EncryptedPrivKey: helpers.ToNullString(input.EncryptedPrivKey),
		EncryptionIv:     helpers.ToNullString(input.EncryptionIv),
		PhotoUrl:         helpers.ToNullString(input.PhotoURL),
		BotDescription:   helpers.ToNullString(input.BotDescription),
	}

	if input.BotCommands != nil {
		params.BotCommands = pqtype.NullRawMessage{
			RawMessage: json.RawMessage(*input.BotCommands),
			Valid:      true,
		}
	}

	_, err = r.Store.UpdateUser(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to update profile: %w", err)
	}

	return loaders.LoadUser(ctx, authID)
}

func (r *mutationResolver) CreateBot(ctx context.Context, username string, firstName string, lastName *string, description *string, commands *string) (model.CreateBotResult, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return &model.ForbiddenError{Message: "Unauthorized"}, nil
	}

	trimmedUsername := strings.TrimSpace(username)
	if !strings.HasSuffix(strings.ToLower(trimmedUsername), "bot") {
		field := "username"
		return &model.ValidationError{
			Field:   &field,
			Message: "Username must end with 'bot'",
		}, nil
	}

	ownerUUID, err := uuid.Parse(authID)
	if err != nil {
		return &model.InternalError{Message: "Invalid session owner ID"}, nil
	}

	botID := uuid.New()
	params := dbgen.CreateUserParams{
		ID:             botID,
		Username:       database.ToNullString(&trimmedUsername),
		FirstName:      strings.TrimSpace(firstName),
		LastName:       database.ToNullString(lastName),
		Password:       sql.NullString{Valid: false},
		Status:         "OFFLINE",
		IsBot:          true,
		BotDescription: database.ToNullString(description),
		BotOwnerID:     uuid.NullUUID{UUID: ownerUUID, Valid: true},
	}

	if commands != nil && *commands != "" {
		params.BotCommands = pqtype.NullRawMessage{
			RawMessage: json.RawMessage(*commands),
			Valid:      true,
		}
	}

	botUser, err := r.Store.CreateUser(ctx, params)
	if err != nil {
		if strings.Contains(err.Error(), "unique") {
			field := "username"
			return &model.ValidationError{
				Field:   &field,
				Message: "Username already taken",
			}, nil
		}
		return &model.InternalError{Message: "Failed to create bot entry"}, nil
	}

	resp, err := r.AuthClient.CreateBotToken(ctx, &authv1.CreateBotTokenRequest{
		BotId: botID.String(),
	})
	if err != nil {
		return &model.InternalError{Message: "Failed to generate bot token"}, nil
	}

	return &model.CreateBotPayload{
		BotToken: resp.AccessToken,
		User:     &botUser,
	}, nil
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

func (r *userResolver) Email(ctx context.Context, obj *dbgen.User) (*string, error) {
	if !obj.Email.Valid {
		return nil, nil
	}
	return &obj.Email.String, nil
}

func (r *userResolver) FirstName(ctx context.Context, obj *dbgen.User) (string, error) {
	return obj.FirstName, nil
}

func (r *userResolver) LastName(ctx context.Context, obj *dbgen.User) (*string, error) {
	if !obj.LastName.Valid {
		return nil, nil
	}
	return &obj.LastName.String, nil
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
	return helpers.ToStringPtr(obj.PhotoUrl), nil
}

func (r *userResolver) Bio(ctx context.Context, obj *dbgen.User) (*string, error) {
	return nil, nil
}

func (r *userResolver) Status(ctx context.Context, obj *dbgen.User) (string, error) {
	return loaders.LoadPresence(ctx, obj.ID.String())
}

func (r *userResolver) IsVerified(ctx context.Context, obj *dbgen.User) (bool, error) {
	return obj.IsVerified, nil
}

func (r *userResolver) IsPremium(ctx context.Context, obj *dbgen.User) (bool, error) {
	return obj.IsPremium, nil
}

func (r *userResolver) IsBot(ctx context.Context, obj *dbgen.User) (bool, error) {
	return obj.IsBot, nil
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

func (r *userResolver) BotDescription(ctx context.Context, obj *dbgen.User) (*string, error) {
	return helpers.ToStringPtr(obj.BotDescription), nil
}

func (r *userResolver) BotCommands(ctx context.Context, obj *dbgen.User) (*string, error) {
	if !obj.BotCommands.Valid {
		return nil, nil
	}
	str := string(obj.BotCommands.RawMessage)
	return &str, nil
}

func (r *Resolver) User() graph.UserResolver { return &userResolver{r} }

type userResolver struct{ *Resolver }
