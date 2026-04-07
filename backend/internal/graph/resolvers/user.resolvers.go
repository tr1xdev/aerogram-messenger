package resolvers

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"

	"github.com/google/uuid"
	"github.com/sqlc-dev/pqtype"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/graph"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/helpers"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/loaders"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/model"
	authv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/auth/v1"
	userv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/user/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/middleware"
	"github.com/tr1xdev/aerogram-messenger/internal/repositories"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
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

	if input.BotCommands != nil && *input.BotCommands != "" {
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

	resp, err := r.UserClient.CreateBot(ctx, &userv1.CreateBotRequest{
		OwnerId:     authID,
		Username:    username,
		FirstName:   firstName,
		LastName:    lastName,
		Description: description,
		Commands:    commands,
	})

	if err != nil {
		st, ok := status.FromError(err)
		if ok {
			switch st.Code() {
			case codes.ResourceExhausted:
				return &model.InternalError{Message: "Limit exceeded: " + st.Message()}, nil
			case codes.FailedPrecondition:
				return &model.InternalError{Message: st.Message()}, nil
			case codes.InvalidArgument:
				field := "input"
				return &model.ValidationError{Field: &field, Message: st.Message()}, nil
			}
		}
		return &model.InternalError{Message: "Service error"}, nil
	}

	botProto := resp.GetUser()
	botID, _ := uuid.Parse(botProto.Id)

	botUser := dbgen.User{
		ID:        botID,
		FirstName: botProto.FirstName,
		IsBot:     true,
	}

	tokenResp, err := r.AuthClient.CreateBotToken(ctx, &authv1.CreateBotTokenRequest{
		BotId: botProto.Id,
	})
	if err != nil {
		return &model.InternalError{Message: "Failed to generate bot token"}, nil
	}

	return &model.CreateBotPayload{
		BotToken: tokenResp.AccessToken,
		User:     &botUser,
	}, nil
}

func (r *mutationResolver) UpdateBot(ctx context.Context, id string, input model.UpdateUserInput) (*dbgen.User, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, errors.New("unauthorized")
	}

	botUUID, err := uuid.Parse(id)
	if err != nil {
		return nil, errors.New("invalid bot id")
	}

	if input.Username != nil {
		trimmed := strings.TrimSpace(*input.Username)
		if !strings.HasSuffix(strings.ToLower(trimmed), "bot") {
			return nil, errors.New("bot username must end with 'bot'")
		}
	}

	ownerUUID, err := uuid.Parse(authID)
	if err != nil {
		return nil, errors.New("invalid owner id")
	}

	params := dbgen.UpdateBotParams{
		ID:               botUUID,
		BotOwnerID:       uuid.NullUUID{UUID: ownerUUID, Valid: true},
		FirstName:        helpers.ToNullString(input.FirstName),
		LastName:         helpers.ToNullString(input.LastName),
		Username:         helpers.ToNullString(input.Username),
		PublicKey:        helpers.ToNullString(input.PublicKey),
		EncryptedPrivKey: helpers.ToNullString(input.EncryptedPrivKey),
		EncryptionIv:     helpers.ToNullString(input.EncryptionIv),
		PhotoUrl:         helpers.ToNullString(input.PhotoURL),
		BotDescription:   helpers.ToNullString(input.BotDescription),
	}

	if input.BotCommands != nil && *input.BotCommands != "" {
		params.BotCommands = pqtype.NullRawMessage{
			RawMessage: json.RawMessage(*input.BotCommands),
			Valid:      true,
		}
	}

	user, err := r.Store.UpdateBot(ctx, params)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("bot not found or access denied")
		}
		return nil, fmt.Errorf("failed to update bot: %w", err)
	}

	return &user, nil
}

func (r *mutationResolver) DeleteBot(ctx context.Context, id string) (bool, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return false, errors.New("unauthorized")
	}

	botUUID, err := uuid.Parse(id)
	if err != nil {
		return false, errors.New("invalid bot id")
	}

	ownerUUID, err := uuid.Parse(authID)
	if err != nil {
		return false, errors.New("invalid owner id")
	}

	err = r.Store.DeleteBot(ctx, dbgen.DeleteBotParams{
		ID:         botUUID,
		BotOwnerID: uuid.NullUUID{UUID: ownerUUID, Valid: true},
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, errors.New("bot not found or already deleted")
		}
		return false, fmt.Errorf("failed to delete bot: %w", err)
	}

	return true, nil
}

func (r *mutationResolver) RotateBotToken(ctx context.Context, id string) (string, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return "", errors.New("unauthorized")
	}

	botUUID, err := uuid.Parse(id)
	if err != nil {
		return "", errors.New("invalid bot id")
	}

	bot, err := r.Store.GetUserByID(ctx, botUUID)
	if err != nil {
		return "", errors.New("bot not found")
	}

	if !bot.BotOwnerID.Valid || bot.BotOwnerID.UUID.String() != authID {
		return "", errors.New("access denied: you are not the owner")
	}

	resp, err := r.AuthClient.CreateBotToken(ctx, &authv1.CreateBotTokenRequest{
		BotId: id,
	})
	if err != nil {
		return "", fmt.Errorf("failed to rotate token: %w", err)
	}

	return resp.AccessToken, nil
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
	cleanQuery := strings.TrimSpace(username)
	if len(cleanQuery) < 3 {
		return []*dbgen.User{}, nil
	}
	users, err := r.Store.SearchUsersByUsername(ctx, cleanQuery)
	if err != nil {
		return nil, err
	}
	result := make([]*dbgen.User, len(users))
	for i := range users {
		result[i] = &users[i]
	}
	return result, nil
}

func (r *queryResolver) MyBots(ctx context.Context) ([]*dbgen.User, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, errors.New("unauthorized")
	}
	ownerUUID, err := uuid.Parse(authID)
	if err != nil {
		return nil, errors.New("invalid user id")
	}
	bots, err := r.Store.GetBotsByOwnerID(ctx, uuid.NullUUID{
		UUID:  ownerUUID,
		Valid: true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch bots: %w", err)
	}
	result := make([]*dbgen.User, len(bots))
	for i := range bots {
		result[i] = &bots[i]
	}
	return result, nil
}

func (r *subscriptionResolver) UserStatusChanged(ctx context.Context, chatID string) (<-chan *model.UserStatusPayload, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		log.Println("[SUB-PRESENCE] Unauthorized attempt")
		return nil, errors.New("unauthorized")
	}

	statusChan := make(chan *model.UserStatusPayload, 1)
	pubsub := r.RedisClient.Subscribe(ctx, "presence:updates")

	go func() {
		defer func() {
			pubsub.Close()
			close(statusChan)
		}()

		for {
			select {
			case <-ctx.Done():
				return
			case msg, ok := <-pubsub.Channel():
				if !ok {
					return
				}

				var ps repositories.PresenceStatus
				if err := json.Unmarshal([]byte(msg.Payload), &ps); err != nil {
					continue
				}

				payload := &model.UserStatusPayload{
					UserID: ps.UserID.String(),
					Status: ps.Status,
				}

				if ps.LastSeen != "" {
					ls := ps.LastSeen
					payload.LastSeen = &ls
				}

				select {
				case statusChan <- payload:
				case <-ctx.Done():
					return
				default:
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
	status, err := loaders.LoadPresence(ctx, obj.ID.String())
	if err != nil {
		log.Printf("[RESOLVER-USER-STATUS] Error for user %s: %v", obj.ID, err)
		return "offline", nil
	}

	return status, nil
}

func (r *userResolver) IsVerified(ctx context.Context, obj *dbgen.User) (bool, error) {
	return obj.IsVerified, nil
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
