package resolvers

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/google/uuid"
	dbgen "github.com/tr1xdev/aerogram-messenger/internal/database/sqlc/gen"
	"github.com/tr1xdev/aerogram-messenger/internal/graph"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/helpers"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/loaders"
	"github.com/tr1xdev/aerogram-messenger/internal/graph/model"
	messagesv1 "github.com/tr1xdev/aerogram-messenger/internal/grpc/gen/messages/v1"
	"github.com/tr1xdev/aerogram-messenger/internal/middleware"
	"github.com/vektah/gqlparser/v2/gqlerror"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/encoding/protojson"
)

func (r *attachmentResolver) URL(ctx context.Context, obj *model.Attachment) (string, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return "", &gqlerror.Error{
			Message:    "Unauthorized access",
			Extensions: map[string]interface{}{"code": "UNAUTHORIZED"},
		}
	}

	url, err := r.Storage.GetPresignedURL(ctx, obj.FileName, 15*time.Minute)
	if err != nil {
		return "", fmt.Errorf("failed to generate secure url: %w", err)
	}

	return url, nil
}

func (r *messageResolver) ID(ctx context.Context, obj *model.Message) (string, error) {
	return helpers.EncodeGlobalID("Message", helpers.ToRawID(obj.ID)), nil
}

func (r *messageResolver) Sender(ctx context.Context, obj *model.Message) (*dbgen.User, error) {
	if obj.Sender != nil && obj.Sender.FirstName != "" {
		return obj.Sender, nil
	}
	if obj.Sender != nil {
		return loaders.LoadUser(ctx, obj.Sender.ID.String())
	}
	return nil, nil
}

func (r *messageResolver) Attachments(ctx context.Context, obj *model.Message) ([]*model.Attachment, error) {
	if len(obj.Attachments) > 0 {
		return obj.Attachments, nil
	}

	rawID := helpers.ToRawID(obj.ID)
	msgUUID, err := uuid.Parse(rawID)
	if err != nil {
		return nil, nil
	}

	dbAttachments, err := r.Store.GetAttachmentsByMessageIDs(ctx, []uuid.UUID{msgUUID})
	if err != nil {
		return nil, nil
	}

	result := make([]*model.Attachment, 0, len(dbAttachments))
	for _, a := range dbAttachments {
		result = append(result, &model.Attachment{
			ID:          helpers.EncodeGlobalID("Attachment", a.ID.String()),
			Type:        a.Type,
			FileName:    a.FileName,
			FileSize:    a.FileSize,
			ContentType: a.ContentType,
		})
	}

	return result, nil
}

func (r *messageResolver) ReplyTo(ctx context.Context, obj *model.Message) (*model.Message, error) {
	if obj.ReplyTo == nil {
		return nil, nil
	}
	return loaders.LoadMessage(ctx, helpers.ToRawID(obj.ReplyTo.ID))
}

func (r *messageResolver) ForwardedFrom(ctx context.Context, obj *model.Message) (*model.Message, error) {
	if obj.ForwardedFrom == nil {
		return nil, nil
	}
	return loaders.LoadMessage(ctx, helpers.ToRawID(obj.ForwardedFrom.ID))
}

func (r *mutationResolver) SendMessage(ctx context.Context, chatID string, text string, replyToID *string, attachments []*graphql.Upload) (model.SendMessageResult, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, &gqlerror.Error{
			Message:    "Unauthorized access",
			Extensions: map[string]interface{}{"code": "UNAUTHORIZED"},
		}
	}

	var rawReplyTo *string
	if replyToID != nil {
		val := helpers.ToRawID(*replyToID)
		rawReplyTo = &val
	}

	var pbAttachments []*messagesv1.Attachment
	for _, upload := range attachments {
		if upload == nil {
			continue
		}
		fileName := uuid.New().String() + "_" + upload.Filename

		_, err := r.Storage.UploadFile(ctx, fileName, upload.File, upload.ContentType)
		if err != nil {
			return nil, &gqlerror.Error{
				Message:    "Failed to upload attachment",
				Extensions: map[string]interface{}{"code": "UPLOAD_ERROR"},
			}
		}

		pbAttachments = append(pbAttachments, &messagesv1.Attachment{
			Type:     upload.ContentType,
			FileName: fileName,
			FileSize: int64(upload.Size),
		})
	}

	resp, err := r.MessagesClient.SendMessage(ctx, &messagesv1.SendMessageRequest{
		ChatId:      helpers.ToRawID(chatID),
		SenderId:    authID,
		Text:        text,
		ReplyToId:   rawReplyTo,
		Attachments: pbAttachments,
	})

	if err != nil {
		st, ok := status.FromError(err)
		if ok && st.Code() == codes.ResourceExhausted {
			return nil, &gqlerror.Error{
				Message:    "Rate limit exceeded",
				Extensions: map[string]interface{}{"code": "RESOURCE_EXHAUSTED"},
			}
		}
		return nil, &gqlerror.Error{
			Message:    "Internal server error",
			Extensions: map[string]interface{}{"code": "INTERNAL_SERVER_ERROR"},
		}
	}

	msg, err := r.Enricher.EnrichMessage(ctx, resp.Message.Id)
	if err != nil {
		return r.Enricher.MapMessageToModel(resp.Message), nil
	}

	return msg, nil
}

func (r *mutationResolver) UpdateMessage(ctx context.Context, id string, text string) (model.SendMessageResult, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, &gqlerror.Error{Message: "Unauthorized", Extensions: map[string]interface{}{"code": "UNAUTHORIZED"}}
	}

	resp, err := r.MessagesClient.UpdateMessage(ctx, &messagesv1.UpdateMessageRequest{
		Id:       helpers.ToRawID(id),
		SenderId: authID,
		Text:     text,
	})

	if err != nil {
		return nil, fmt.Errorf("failed to update message")
	}

	msg, err := r.Enricher.EnrichMessage(ctx, resp.Message.Id)
	if err != nil {
		return r.Enricher.MapMessageToModel(resp.Message), nil
	}

	return msg, nil
}

func (r *mutationResolver) DeleteMessage(ctx context.Context, id string) (bool, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return false, nil
	}

	_, err := r.MessagesClient.DeleteMessage(ctx, &messagesv1.DeleteMessageRequest{
		Id:       helpers.ToRawID(id),
		SenderId: authID,
	})
	return err == nil, nil
}

func (r *mutationResolver) MarkDialogAsRead(ctx context.Context, chatID string) (bool, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return false, nil
	}

	rawChatID := helpers.ToRawID(chatID)
	chatUUID, _ := uuid.Parse(rawChatID)
	authUUID, _ := uuid.Parse(authID)

	msg, err := r.Store.GetLastChatMessage(ctx, chatUUID)
	if err != nil {
		return true, nil
	}

	_ = r.Store.UpdateMemberReadSequence(ctx, dbgen.UpdateMemberReadSequenceParams{
		DialogID:         chatUUID,
		UserID:           authUUID,
		LastReadSequence: msg.Sequence,
	})

	_, _ = r.MessagesClient.MarkAsRead(ctx, &messagesv1.MarkAsReadRequest{
		ChatId:        rawChatID,
		UserId:        authID,
		LastMessageId: msg.ID.String(),
	})

	payload := model.ReadPayload{
		ChatID:       helpers.EncodeGlobalID("Chat", rawChatID),
		UserID:       helpers.EncodeGlobalID("User", authID),
		LastSequence: msg.Sequence,
	}
	data, _ := json.Marshal(payload)
	r.RedisClient.Publish(ctx, "chat:"+rawChatID+":read", data)

	return true, nil
}

func (r *queryResolver) MessageHistory(ctx context.Context, chatID string, limit int, beforeSequence *int64) (model.MessageHistoryResult, error) {
	rawChatID := helpers.ToRawID(chatID)
	req := &messagesv1.GetHistoryRequest{
		ChatId: rawChatID,
		Limit:  int32(limit),
	}
	if beforeSequence != nil {
		req.BeforeSequence = beforeSequence
	}

	resp, err := r.MessagesClient.GetHistory(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("history unavailable")
	}

	messages := make([]*model.Message, 0, len(resp.Messages))
	for _, m := range resp.Messages {
		enriched, err := r.Enricher.EnrichMessage(ctx, m.Id)
		if err == nil {
			messages = append(messages, enriched)
		} else if mapped := r.Enricher.MapMessageToModel(m); mapped != nil {
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

	rawChatID := helpers.ToRawID(chatID)
	chatUUID, _ := uuid.Parse(rawChatID)
	userUUID, _ := uuid.Parse(authID)

	member, err := r.Store.GetDialogMember(ctx, dbgen.GetDialogMemberParams{
		DialogID: chatUUID,
		UserID:   userUUID,
	})
	if err != nil {
		return &model.ReadPayload{
			ChatID:       helpers.EncodeGlobalID("Chat", rawChatID),
			UserID:       helpers.EncodeGlobalID("User", authID),
			LastSequence: 0,
		}, nil
	}

	return &model.ReadPayload{
		ChatID:       helpers.EncodeGlobalID("Chat", rawChatID),
		UserID:       helpers.EncodeGlobalID("User", authID),
		LastSequence: member.LastReadSequence,
	}, nil
}

func (r *subscriptionResolver) MessageAdded(ctx context.Context, chatID string) (<-chan *model.Message, error) {
	rawChatID := helpers.ToRawID(chatID)
	out := make(chan *model.Message, 1)
	pubsub := r.RedisClient.Subscribe(ctx, "chat:"+rawChatID)

	go func() {
		defer pubsub.Close()
		defer close(out)
		unmarshaller := protojson.UnmarshalOptions{DiscardUnknown: true}

		for {
			select {
			case <-ctx.Done():
				return
			case msg, ok := <-pubsub.Channel():
				if !ok {
					return
				}

				var pbMsg messagesv1.Message
				if err := unmarshaller.Unmarshal([]byte(msg.Payload), &pbMsg); err != nil {
					continue
				}

				m, err := r.Enricher.EnrichMessage(ctx, pbMsg.Id)
				if err != nil {
					m = r.Enricher.MapMessageToModel(&pbMsg)
				}

				if m != nil {
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

func (r *subscriptionResolver) MessageUpdated(ctx context.Context, chatID string) (<-chan *model.Message, error) {
	rawChatID := helpers.ToRawID(chatID)
	out := make(chan *model.Message, 1)
	pubsub := r.RedisClient.Subscribe(ctx, "chat:"+rawChatID+":updated")

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
				if err := protojson.Unmarshal([]byte(msg.Payload), &pbMsg); err != nil {
					continue
				}
				m, err := r.Enricher.EnrichMessage(ctx, pbMsg.Id)
				if err != nil {
					m = r.Enricher.MapMessageToModel(&pbMsg)
				}
				if m != nil {
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

func (r *subscriptionResolver) MessageDeleted(ctx context.Context, chatID string) (<-chan string, error) {
	rawChatID := helpers.ToRawID(chatID)
	out := make(chan string, 1)
	pubsub := r.RedisClient.Subscribe(ctx, "chat:"+rawChatID+":deleted")

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
				select {
				case out <- helpers.EncodeGlobalID("Message", msg.Payload):
				case <-ctx.Done():
					return
				}
			}
		}
	}()
	return out, nil
}

func (r *subscriptionResolver) DialogRead(ctx context.Context, chatID string) (<-chan *model.ReadPayload, error) {
	rawChatID := helpers.ToRawID(chatID)
	readChan := make(chan *model.ReadPayload, 1)
	pubsub := r.RedisClient.Subscribe(ctx, "chat:"+rawChatID+":read")

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
					payload.ChatID = helpers.EncodeGlobalID("Chat", helpers.ToRawID(payload.ChatID))
					payload.UserID = helpers.EncodeGlobalID("User", helpers.ToRawID(payload.UserID))
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

func (r *Resolver) Attachment() graph.AttachmentResolver { return &attachmentResolver{r} }
func (r *Resolver) Message() graph.MessageResolver       { return &messageResolver{r} }

type attachmentResolver struct{ *Resolver }
type messageResolver struct{ *Resolver }
