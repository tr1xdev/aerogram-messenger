package resolvers

import (
	"context"
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
	if obj == nil || obj.ID == "" {
		return nil, nil
	}

	msgUUID, err := uuid.Parse(obj.ID)
	if err != nil {
		return nil, nil
	}

	dbMsg, err := r.Store.GetMessageByID(ctx, msgUUID)
	if err != nil {
		return nil, fmt.Errorf("message not found: %w", err)
	}

	return loaders.LoadUser(ctx, dbMsg.AuthorID.String())
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

	if resp.Message.ReplyToId != nil && *resp.Message.ReplyToId != "" {
		mr := &messageResolver{r.Resolver}
		replyMsg, err := mr.ReplyTo(ctx, msg)
		if err == nil {
			msg.ReplyTo = replyMsg
		}
	}

	payload, _ := json.Marshal(msg)
	r.RedisClient.Publish(ctx, "chat:"+chatID, payload)

	return msg, nil
}

func (r *mutationResolver) UpdateMessage(ctx context.Context, id string, text string) (model.SendMessageResult, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return &model.ForbiddenError{Message: "Unauthorized"}, nil
	}

	resp, err := r.MessagesClient.UpdateMessage(ctx, &messagesv1.UpdateMessageRequest{
		Id:       id,
		SenderId: authID,
		Text:     text,
	})
	if err != nil {
		return &model.InternalError{Message: err.Error()}, nil
	}

	msg := helpers.MapMessageToModel(resp.Message)
	payload, _ := json.Marshal(msg)
	r.RedisClient.Publish(ctx, "chat:"+resp.Message.ChatId, payload)

	return msg, nil
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

	chatUUID, _ := uuid.Parse(chatID)
	lastMsg, err := r.Store.GetLastChatMessage(ctx, chatUUID)
	if err != nil {
		return false, err
	}

	_, err = r.MessagesClient.MarkAsRead(ctx, &messagesv1.MarkAsReadRequest{
		ChatId:        chatID,
		UserId:        authID,
		LastMessageId: lastMsg.ID.String(),
	})
	if err != nil {
		return false, err
	}

	payload := model.ReadPayload{
		ChatID:       chatID,
		UserID:       authID,
		LastSequence: lastMsg.Sequence,
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

	messages := make([]*model.Message, len(resp.Messages))
	for i, m := range resp.Messages {
		messages[i] = helpers.MapMessageToModel(m)
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

	chatUUID, _ := uuid.Parse(chatID)
	userUUID, _ := uuid.Parse(authID)

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
		for msg := range pubsub.Channel() {
			var m model.Message
			if err := json.Unmarshal([]byte(msg.Payload), &m); err == nil {
				out <- &m
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
				if err := json.Unmarshal([]byte(msg.Payload), &payload); err != nil {
					continue
				}

				select {
				case readChan <- &payload:
				case <-ctx.Done():
					return
				}
			}
		}
	}()

	return readChan, nil
}

func (r *messageResolver) ReplyTo(ctx context.Context, obj *model.Message) (*model.Message, error) {
	if obj == nil || obj.ReplyTo == nil || obj.ReplyTo.ID == "" {
		return nil, nil
	}

	if obj.ReplyTo.Text != "" {
		return obj.ReplyTo, nil
	}

	msgUUID, err := uuid.Parse(obj.ReplyTo.ID)
	if err != nil {
		return nil, nil
	}

	dbMsg, err := r.Store.GetMessageByID(ctx, msgUUID)
	if err != nil {
		return nil, nil
	}

	return helpers.MapDBMessageToModel(&dbMsg), nil
}

func (r *Resolver) Message() graph.MessageResolver { return &messageResolver{r} }

type messageResolver struct{ *Resolver }
