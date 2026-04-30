package resolvers

import (
	"github.com/tr1xdev/aerogram-messenger/internal/graph/model"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (r *Resolver) mapToCreateChatError(err error) model.CreateChatResult {
	st, _ := status.FromError(err)
	switch st.Code() {
	case codes.PermissionDenied:
		return &model.ForbiddenError{Message: "access denied"}
	case codes.NotFound:
		return &model.NotFoundError{Message: "user or chat template not found"}
	default:
		return &model.InternalError{Message: st.Message()}
	}
}

func (r *Resolver) mapToPinChatError(err error) model.PinChatResult {
	st, _ := status.FromError(err)
	switch st.Code() {
	case codes.PermissionDenied:
		return &model.ForbiddenError{Message: "access denied"}
	case codes.NotFound:
		return &model.NotFoundError{Message: "chat not found"}
	default:
		return &model.InternalError{Message: st.Message()}
	}
}

func (r *Resolver) mapToDeleteChatError(err error) model.DeleteChatResult {
	st, _ := status.FromError(err)
	switch st.Code() {
	case codes.PermissionDenied:
		return &model.ForbiddenError{Message: "access denied"}
	case codes.NotFound:
		return &model.NotFoundError{Message: "chat not found"}
	default:
		return &model.InternalError{Message: st.Message()}
	}
}

func (r *Resolver) mapToInviteError(err error) model.InviteResult {
	st, _ := status.FromError(err)
	switch st.Code() {
	case codes.PermissionDenied:
		return &model.ForbiddenError{Message: "access denied"}
	case codes.NotFound:
		return &model.NotFoundError{Message: "not found"}
	default:
		return &model.InternalError{Message: st.Message()}
	}
}

func (r *Resolver) mapToChatError(err error) model.ChatResult {
	st, _ := status.FromError(err)
	switch st.Code() {
	case codes.NotFound:
		return &model.NotFoundError{Message: "chat not found"}
	case codes.PermissionDenied:
		return &model.ForbiddenError{Message: "access denied"}
	default:
		return &model.InternalError{Message: st.Message()}
	}
}

func (r *Resolver) mapToRemoveMemberError(err error) model.RemoveMemberResult {
	st, _ := status.FromError(err)
	switch st.Code() {
	case codes.PermissionDenied:
		return &model.ForbiddenError{Message: "access denied"}
	case codes.NotFound:
		return &model.NotFoundError{Message: "member not found"}
	default:
		return &model.InternalError{Message: st.Message()}
	}
}

func (r *Resolver) mapToChatMembersError(err error) model.ChatMembersResult {
	st, _ := status.FromError(err)
	switch st.Code() {
	case codes.PermissionDenied:
		return &model.ForbiddenError{Message: "access denied"}
	default:
		return &model.InternalError{Message: st.Message()}
	}
}

func (r *Resolver) mapToLeaveChatError(err error) model.LeaveChatResult {
	st, _ := status.FromError(err)
	switch st.Code() {
	case codes.NotFound:
		return &model.NotFoundError{Message: st.Message()}
	case codes.PermissionDenied:
		return &model.ForbiddenError{Message: st.Message()}
	case codes.FailedPrecondition:
		return &model.ForbiddenError{Message: st.Message()}
	default:
		return &model.InternalError{Message: "internal error"}
	}
}
