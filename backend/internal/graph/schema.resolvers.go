package graph

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/aerogram-org/aerogram-api/internal/graph/model"
	authpb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/auth/v1"
	chatpb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/chat/v1"
	messagespb "github.com/aerogram-org/aerogram-api/internal/grpc/gen/messages/v1"
	"github.com/aerogram-org/aerogram-api/internal/middleware"
	"github.com/aerogram-org/aerogram-api/internal/models"
)

func (r *messageResolver) ChatID(ctx context.Context, obj *models.Message) (string, error) {
	return obj.DialogID, nil
}

func (r *messageResolver) Sender(ctx context.Context, obj *models.Message) (*models.User, error) {
	return LoadUser(ctx, obj.AuthorID)
}

func (r *messageResolver) Text(ctx context.Context, obj *models.Message) (string, error) {
	return obj.Content, nil
}

func (r *messageResolver) SentAt(ctx context.Context, obj *models.Message) (string, error) {
	return obj.CreatedAt.Format(time.RFC3339), nil
}

func (r *messageResolver) Sequence(ctx context.Context, obj *models.Message) (int64, error) {
	if obj == nil {
		return 0, nil
	}
	return obj.Sequence, nil
}

func (r *messageResolver) ReplyTo(ctx context.Context, obj *models.Message) (*models.Message, error) {
	if obj.ReplyToID == nil || *obj.ReplyToID == "" {
		return nil, nil
	}
	var msg models.Message
	if err := r.db.First(&msg, "id = ?", *obj.ReplyToID).Error; err != nil {
		return nil, nil
	}
	return &msg, nil
}

func (r *messageResolver) ForwardedFrom(ctx context.Context, obj *models.Message) (*models.Message, error) {
	if obj.ForwardFromID == nil || *obj.ForwardFromID == "" {
		return nil, nil
	}
	var msg models.Message
	if err := r.db.First(&msg, "id = ?", *obj.ForwardFromID).Error; err != nil {
		return nil, nil
	}
	return &msg, nil
}

func (r *mutationResolver) SignUp(ctx context.Context, input model.SignUpInput) (*model.AuthPayload, error) {
	req := &authpb.SignUpRequest{
		Email:     input.Email,
		FirstName: input.FirstName,
		Password:  input.Password,
		LastName:  input.LastName,
		Username:  input.Username,
	}
	resp, err := r.authClient.SignUp(ctx, req)
	if err != nil {
		return nil, mapGRPCError(err)
	}
	return &model.AuthPayload{UserID: &resp.UserId}, nil
}

func (r *mutationResolver) Login(ctx context.Context, input model.LoginInput) (*model.AuthPayload, error) {
	resp, err := r.authClient.Login(ctx, &authpb.LoginRequest{
		Email:    input.Email,
		Password: input.Password,
	})
	if err != nil {
		return nil, mapGRPCError(err)
	}
	return &model.AuthPayload{UserID: &resp.UserId}, nil
}

func (r *mutationResolver) VerifyEmail(ctx context.Context, input model.VerifyEmailInput) (*model.VerifyEmailPayload, error) {
	resp, err := r.authClient.VerifyEmail(ctx, &authpb.VerifyEmailRequest{
		UserId: input.UserID,
		Code:   input.Code,
	})
	if err != nil {
		return nil, mapGRPCError(err)
	}
	return &model.VerifyEmailPayload{
		AccessToken:  resp.AccessToken,
		RefreshToken: resp.RefreshToken,
	}, nil
}

func (r *mutationResolver) UpdateUser(ctx context.Context, input model.UpdateUserInput) (*models.User, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, errors.New("unauthorized access")
	}
	updates := make(map[string]interface{})
	if input.FirstName != nil {
		updates["first_name"] = *input.FirstName
	}
	if input.LastName != nil {
		updates["last_name"] = *input.LastName
	}
	if input.Username != nil {
		updates["username"] = *input.Username
	}
	if input.PublicKey != nil {
		updates["public_key"] = *input.PublicKey
	}
	if len(updates) == 0 {
		return r.userRepo.GetByID(authID)
	}
	return r.userRepo.UpdateProfile(authID, updates)
}

func (r *mutationResolver) RefreshToken(ctx context.Context, token string) (*model.VerifyEmailPayload, error) {
	resp, err := r.authClient.RefreshToken(ctx, &authpb.RefreshTokenRequest{RefreshToken: token})
	if err != nil {
		return nil, mapGRPCError(err)
	}
	return &model.VerifyEmailPayload{
		AccessToken:  resp.AccessToken,
		RefreshToken: resp.RefreshToken,
	}, nil
}

func (r *mutationResolver) CreateChat(ctx context.Context, typeArg model.ChatType, participantIds []string, slug *string, title *string) (*model.Chat, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, errors.New("unauthorized access")
	}
	req := &chatpb.CreateChatRequest{
		Type:           chatpb.ChatType(chatpb.ChatType_value["CHAT_TYPE_"+string(typeArg)]),
		ParticipantIds: participantIds,
		CreatorId:      authID,
		Title:          title,
		Slug:           slug,
	}
	resp, err := r.chatClient.CreateChat(ctx, req)
	if err != nil {
		return nil, mapGRPCError(err)
	}
	return r.enrichChat(ctx, authID, resp.Chat)
}

func (r *mutationResolver) SendMessage(ctx context.Context, chatID string, text string, isEncrypted bool, encryptionIv *string, replyToID *string) (*models.Message, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, errors.New("unauthorized")
	}
	resp, err := r.messagesClient.SendMessage(ctx, &messagespb.SendMessageRequest{
		ChatId:       chatID,
		SenderId:     authID,
		Text:         text,
		IsEncrypted:  isEncrypted,
		EncryptionIv: encryptionIv,
		ReplyToId:    replyToID,
	})
	if err != nil {
		return nil, mapGRPCError(err)
	}
	sentAt, _ := time.Parse(time.RFC3339, resp.Message.SentAt)
	msg := &models.Message{
		ID:           resp.Message.Id,
		DialogID:     resp.Message.ChatId,
		AuthorID:     resp.Message.SenderId,
		Content:      resp.Message.Text,
		CreatedAt:    sentAt,
		Sequence:     resp.Message.Sequence,
		IsEncrypted:  resp.Message.IsEncrypted,
		EncryptionIV: resp.Message.EncryptionIv,
	}
	payload, _ := json.Marshal(msg)
	r.redisClient.Publish(ctx, "chat:"+chatID, payload)
	return msg, nil
}

func (r *mutationResolver) UpdateMessage(ctx context.Context, id string, text string) (*models.Message, error) {
	authID := middleware.GetUserID(ctx)
	resp, err := r.messagesClient.UpdateMessage(ctx, &messagespb.UpdateMessageRequest{
		Id:       id,
		SenderId: authID,
		Text:     text,
	})
	if err != nil {
		return nil, mapGRPCError(err)
	}
	sentAt, _ := time.Parse(time.RFC3339, resp.Message.SentAt)
	return &models.Message{
		ID:        resp.Message.Id,
		Content:   resp.Message.Text,
		AuthorID:  resp.Message.SenderId,
		DialogID:  resp.Message.ChatId,
		CreatedAt: sentAt,
		Sequence:  resp.Message.Sequence,
		IsEdited:  true,
	}, nil
}

func (r *mutationResolver) DeleteMessage(ctx context.Context, id string) (bool, error) {
	authID := middleware.GetUserID(ctx)
	resp, err := r.messagesClient.DeleteMessage(ctx, &messagespb.DeleteMessageRequest{
		Id:       id,
		SenderId: authID,
	})
	if err != nil {
		return false, mapGRPCError(err)
	}
	return resp.Success, nil
}

func (r *mutationResolver) PinChat(ctx context.Context, id string, pinned bool) (bool, error) {
	authID := middleware.GetUserID(ctx)
	resp, err := r.chatClient.PinChat(ctx, &chatpb.PinChatRequest{
		ChatId: id,
		UserId: authID,
		Pinned: pinned,
	})
	if err != nil {
		return false, mapGRPCError(err)
	}
	return resp.Success, nil
}

func (r *mutationResolver) CreateDirectChat(ctx context.Context, userID string) (*model.Chat, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, errors.New("unauthorized access")
	}
	if authID == userID {
		return nil, errors.New("cannot create chat with yourself")
	}
	req := &chatpb.CreateChatRequest{
		Type:           chatpb.ChatType_CHAT_TYPE_PRIVATE,
		ParticipantIds: []string{authID, userID},
		CreatorId:      authID,
	}
	resp, err := r.chatClient.CreateChat(ctx, req)
	if err != nil {
		return nil, mapGRPCError(err)
	}
	return r.enrichChat(ctx, authID, resp.Chat)
}

func (r *mutationResolver) SendTypingEvent(ctx context.Context, chatID string) (bool, error) {
	authID := middleware.GetUserID(ctx)
	payload := map[string]interface{}{
		"userId": authID,
		"status": "typing",
	}
	data, _ := json.Marshal(payload)
	r.redisClient.Publish(ctx, "presence:updates", data)
	return true, nil
}

func (r *mutationResolver) MarkDialogAsRead(ctx context.Context, chatID string, lastSequence int64) (bool, error) {
	userID := middleware.GetUserID(ctx)
	if userID == "" {
		return false, errors.New("unauthorized")
	}
	res := r.db.Model(&models.DialogMember{}).
		Where("dialog_id = ? AND user_id = ? AND last_read_sequence < ?", chatID, userID, lastSequence).
		Update("last_read_sequence", lastSequence)
	if res.Error != nil {
		return false, res.Error
	}
	if res.RowsAffected > 0 {
		payload := model.ReadPayload{
			ChatID:       chatID,
			UserID:       userID,
			LastSequence: lastSequence,
		}
		data, _ := json.Marshal(payload)
		r.redisClient.Publish(ctx, "dialog_read:"+chatID, data)
	}
	return true, nil
}

func (r *mutationResolver) TerminateSession(ctx context.Context, id string) (bool, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return false, errors.New("unauthorized access")
	}
	var session models.Session
	if err := r.db.Where("id = ? AND user_id = ?", id, authID).First(&session).Error; err != nil {
		return false, errors.New("session not found or access denied")
	}
	if err := r.userRepo.TerminateSession(id); err != nil {
		return false, err
	}
	return true, nil
}

func (r *mutationResolver) Logout(ctx context.Context) (bool, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return false, errors.New("unauthorized access")
	}
	sessionID := middleware.GetSessionID(ctx)
	if sessionID == "" {
		return false, errors.New("active session not found")
	}
	if err := r.userRepo.TerminateSession(sessionID); err != nil {
		return false, err
	}
	return true, nil
}

func (r *queryResolver) Me(ctx context.Context) (*models.User, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, errors.New("unauthorized")
	}
	return LoadUser(ctx, authID)
}

func (r *queryResolver) Sessions(ctx context.Context, userID string) ([]*models.Session, error) {
	authID := middleware.GetUserID(ctx)
	if authID != userID {
		return nil, errors.New("permission denied")
	}
	return r.userRepo.GetSessions(userID)
}

func (r *queryResolver) MyChats(ctx context.Context) ([]*model.Chat, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, errors.New("unauthorized access")
	}
	resp, err := r.chatClient.GetMyChats(ctx, &chatpb.GetMyChatsRequest{
		UserId: authID,
	})
	if err != nil {
		return nil, mapGRPCError(err)
	}
	chats := make([]*model.Chat, 0, len(resp.Chats))
	for _, c := range resp.Chats {
		enriched, err := r.enrichChat(ctx, authID, c)
		if err != nil {
			continue
		}
		chats = append(chats, enriched)
	}
	return chats, nil
}

func (r *queryResolver) Chat(ctx context.Context, id *string, slug *string) (*model.Chat, error) {
	authID := middleware.GetUserID(ctx)
	if authID == "" {
		return nil, errors.New("unauthorized access")
	}
	resp, err := r.chatClient.GetChat(ctx, &chatpb.GetChatRequest{
		ChatId: id,
		Slug:   slug,
		UserId: authID,
	})
	if err != nil {
		return nil, mapGRPCError(err)
	}
	return r.enrichChat(ctx, authID, resp.Chat)
}

func (r *queryResolver) MessageHistory(ctx context.Context, chatID string, limit int, offset int) ([]*models.Message, error) {
	resp, err := r.messagesClient.GetHistory(ctx, &messagespb.GetHistoryRequest{
		ChatId: chatID,
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		return nil, mapGRPCError(err)
	}
	var msgs []*models.Message
	for _, m := range resp.Messages {
		sentAt, _ := time.Parse(time.RFC3339, m.SentAt)
		msgs = append(msgs, &models.Message{
			ID:           m.Id,
			DialogID:     m.ChatId,
			AuthorID:     m.SenderId,
			Content:      m.Text,
			CreatedAt:    sentAt,
			Sequence:     m.Sequence,
			IsEdited:     m.IsEdited,
			IsEncrypted:  m.IsEncrypted,
			EncryptionIV: m.EncryptionIv,
		})
	}
	return msgs, nil
}

func (r *queryResolver) SearchUsers(ctx context.Context, username string) ([]*models.User, error) {
	if len(username) < 3 {
		return nil, errors.New("search query must be at least 3 characters")
	}
	return r.userRepo.SearchByUsername(username)
}

func (r *queryResolver) DialogRead(ctx context.Context, chatID string) (*model.ReadPayload, error) {
	userID := middleware.GetUserID(ctx)
	if userID == "" {
		return nil, errors.New("unauthorized access")
	}
	var member models.DialogMember
	err := r.db.Where("dialog_id = ? AND user_id = ?", chatID, userID).First(&member).Error
	if err != nil {
		return nil, err
	}
	return &model.ReadPayload{
		ChatID:       chatID,
		UserID:       userID,
		LastSequence: member.LastReadSequence,
	}, nil
}

func (r *sessionResolver) CreatedAt(ctx context.Context, obj *models.Session) (string, error) {
	return obj.CreatedAt.Format(time.RFC3339), nil
}

func (r *subscriptionResolver) MessageAdded(ctx context.Context, chatID string) (<-chan *models.Message, error) {
	msgChan := make(chan *models.Message, 1)
	pubsub := r.redisClient.Subscribe(ctx, "chat:"+chatID)
	go func() {
		defer pubsub.Close()
		defer close(msgChan)
		ch := pubsub.Channel()
		for {
			select {
			case <-ctx.Done():
				return
			case msg, ok := <-ch:
				if !ok {
					return
				}
				var m models.Message
				if err := json.Unmarshal([]byte(msg.Payload), &m); err != nil {
					continue
				}
				select {
				case msgChan <- &m:
				case <-ctx.Done():
					return
				}
			}
		}
	}()
	return msgChan, nil
}

func (r *subscriptionResolver) UserStatusChanged(ctx context.Context, chatID string) (<-chan *model.UserStatusPayload, error) {
	statusChan := make(chan *model.UserStatusPayload, 1)
	pubsub := r.redisClient.Subscribe(ctx, "presence:updates")
	go func() {
		defer pubsub.Close()
		defer close(statusChan)
		ch := pubsub.Channel()
		for {
			select {
			case <-ctx.Done():
				return
			case msg, ok := <-ch:
				if !ok || msg == nil {
					return
				}
				var p model.UserStatusPayload
				if err := json.Unmarshal([]byte(msg.Payload), &p); err == nil {
					select {
					case statusChan <- &p:
					case <-ctx.Done():
						return
					}
				}
			}
		}
	}()
	return statusChan, nil
}

func (r *subscriptionResolver) DialogRead(ctx context.Context, chatID string) (<-chan *model.ReadPayload, error) {
	readChan := make(chan *model.ReadPayload, 1)
	pubsub := r.redisClient.Subscribe(ctx, "dialog_read:"+chatID)
	authID := middleware.GetUserID(ctx)
	go func() {
		defer pubsub.Close()
		defer close(readChan)
		ch := pubsub.Channel()
		for {
			select {
			case <-ctx.Done():
				return
			case msg, ok := <-ch:
				if !ok || msg == nil {
					return
				}
				var payload model.ReadPayload
				if err := json.Unmarshal([]byte(msg.Payload), &payload); err == nil {
					if payload.UserID != authID {
						select {
						case readChan <- &payload:
						case <-ctx.Done():
							return
						}
					}
				}
			}
		}
	}()
	return readChan, nil
}

func (r *userResolver) Status(ctx context.Context, obj *models.User) (string, error) {
	return LoadPresence(ctx, obj.ID)
}

func (r *Resolver) Message() MessageResolver           { return &messageResolver{r} }
func (r *Resolver) Mutation() MutationResolver         { return &mutationResolver{r} }
func (r *Resolver) Query() QueryResolver               { return &queryResolver{r} }
func (r *Resolver) Session() SessionResolver           { return &sessionResolver{r} }
func (r *Resolver) Subscription() SubscriptionResolver { return &subscriptionResolver{r} }
func (r *Resolver) User() UserResolver                 { return &userResolver{r} }

type messageResolver struct{ *Resolver }
type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
type sessionResolver struct{ *Resolver }
type subscriptionResolver struct{ *Resolver }
type userResolver struct{ *Resolver }
