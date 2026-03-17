package resolvers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/graph"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/helpers"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/loaders"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/model"
	messagesv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/messages/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/middleware"
)

func (r *messageResolver) Sender(ctx context.Context, obj *model.Message) (*dbgen.User, error) {
	if obj == nil || obj.Sender == nil || obj.Sender.ID == uuid.Nil {
		return &dbgen.User{
			ID:        uuid.Nil,
			FirstName: "Deleted",
			Username:  sql.NullString{String: "user", Valid: true},
		}, nil
	}

	user, err := loaders.LoadUser(ctx, obj.Sender.ID.String())
	if err != nil {
		return &dbgen.User{
			ID:        obj.Sender.ID,
			FirstName: "Unknown",
			Username:  sql.NullString{String: "unknown", Valid: true},
		}, nil
	}

	return user, nil
}

func (r *mutationResolver) SendMessage(ctx context.Context, chatID string, text string, isEncrypted bool, encryptionIv *string, replyToID *string) (model.SendMessageResult, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return &model.ForbiddenError{Message: "Unauthorized"}, nil
	}

	resp, err := r.MessagesClient.SendMessage(ctx, &messagesv1.SendMessageRequest{
		ChatId:       chatID,
		SenderId:     authID,
		Text:         text,
		IsEncrypted:  isEncrypted,
		EncryptionIv: encryptionIv,
		ReplyToId:    replyToID,
	})
	if err != nil {
		return &model.InternalError{Message: err.Error()}, nil
	}

	msg := helpers.MapMessageToModel(resp.Message)

	if replyToID != nil && *replyToID != "" {
		if replyMsg, err := loaders.LoadMessage(ctx, *replyToID); err == nil {
			msg.ReplyTo = replyMsg
		}
	}

	return msg, nil
}

func (r *mutationResolver) UpdateMessage(ctx context.Context, id string, text string, encryptionIv *string) (model.SendMessageResult, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return &model.ForbiddenError{Message: "Unauthorized"}, nil
	}

	resp, err := r.MessagesClient.UpdateMessage(ctx, &messagesv1.UpdateMessageRequest{
		Id:           id,
		SenderId:     authID,
		Text:         text,
		EncryptionIv: encryptionIv,
	})
	if err != nil {
		return &model.InternalError{Message: err.Error()}, nil
	}

	return helpers.MapMessageToModel(resp.Message), nil
}

func (r *mutationResolver) DeleteMessage(ctx context.Context, id string) (bool, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return false, nil
	}

	_, err := r.MessagesClient.DeleteMessage(ctx, &messagesv1.DeleteMessageRequest{
		Id:       id,
		SenderId: authID,
	})
	return err == nil, nil
}

func (r *mutationResolver) MarkDialogAsRead(ctx context.Context, chatID string, lastSequence int64) (bool, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return false, nil
	}

	chatUUID, err := uuid.Parse(chatID)
	if err != nil {
		return false, err
	}

	msg, err := r.Store.GetMessageBySequence(ctx, dbgen.GetMessageBySequenceParams{
		DialogID: chatUUID,
		Sequence: lastSequence,
	})
	if err != nil {
		return false, err
	}

	_, err = r.MessagesClient.MarkAsRead(ctx, &messagesv1.MarkAsReadRequest{
		ChatId:        chatID,
		UserId:        authID,
		LastMessageId: msg.ID.String(),
	})
	if err != nil {
		return false, err
	}

	payload := model.ReadPayload{
		ChatID:       chatID,
		UserID:       authID,
		LastSequence: msg.Sequence,
	}
	data, _ := json.Marshal(payload)
	r.RedisClient.Publish(ctx, "chat:"+chatID+":read", data)

	return true, nil
}

func (r *queryResolver) MessageHistory(ctx context.Context, chatID string, limit int, offset int) (model.MessageHistoryResult, error) {
	resp, err := r.MessagesClient.GetHistory(ctx, &messagesv1.GetHistoryRequest{
		ChatId: chatID,
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		return &model.InternalError{Message: err.Error()}, nil
	}

	messages := make([]*model.Message, 0, len(resp.Messages))
	for _, m := range resp.Messages {
		if mapped := helpers.MapMessageToModel(m); mapped != nil {
			messages = append(messages, mapped)
		}
	}

	return &model.MessageConnection{
		Messages: messages,
		HasMore:  len(messages) >= limit,
	}, nil
}

func (r *queryResolver) DialogRead(ctx context.Context, chatID string) (*model.ReadPayload, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, nil
	}

	chatUUID, err := uuid.Parse(chatID)
	if err != nil {
		return nil, err
	}
	userUUID, err := uuid.Parse(authID)
	if err != nil {
		return nil, err
	}

	member, err := r.Store.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
		DialogID: chatUUID,
		UserID:   userUUID,
	})
	if err != nil {
		return &model.ReadPayload{
			ChatID:       chatID,
			UserID:       authID,
			LastSequence: 0,
		}, nil
	}

	return &model.ReadPayload{
		ChatID:       chatID,
		UserID:       authID,
		LastSequence: member.LastReadSequence,
	}, nil
}

func (r *subscriptionResolver) MessageAdded(ctx context.Context, chatID string) (<-chan *model.Message, error) {
	out := make(chan *model.Message, 1)
	pubsub := r.RedisClient.Subscribe(ctx, "chat:"+chatID)

	go func() {
		defer pubsub.Close()
		defer close(out)
		for {
			select {
			case <-ctx.Done():
				return
			case msg, ok := <-pubsub.Channel():
				if !ok {
					return
				}
				var pbMsg messagesv1.Message
				if err := json.Unmarshal([]byte(msg.Payload), &pbMsg); err == nil {
					m := helpers.MapMessageToModel(&pbMsg)
					select {
					case out <- m:
					case <-ctx.Done():
						return
					}
				}
			}
		}
	}()
	return out, nil
}

func (r *subscriptionResolver) DialogRead(ctx context.Context, chatID string) (<-chan *model.ReadPayload, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, fmt.Errorf("unauthorized")
	}

	readChan := make(chan *model.ReadPayload, 1)
	pubsub := r.RedisClient.Subscribe(ctx, "chat:"+chatID+":read")

	go func() {
		defer pubsub.Close()
		defer close(readChan)
		for {
			select {
			case <-ctx.Done():
				return
			case msg, ok := <-pubsub.Channel():
				if !ok {
					return
				}
				var payload model.ReadPayload
				if err := json.Unmarshal([]byte(msg.Payload), &payload); err == nil {
					select {
					case readChan <- &payload:
					case <-ctx.Done():
						return
					}
				}
			}
		}
	}()

	return readChan, nil
}

func (r *Resolver) Message() graph.MessageResolver { return &messageResolver{r} }

type messageResolver struct{ *Resolver }
