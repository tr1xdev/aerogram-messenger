import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_MESSAGE_HISTORY,
  SEND_MESSAGE,
  GET_ME,
  GET_CHAT_BY_ID,
  MARK_AS_READ,
} from "../api/chat.gql";
import type { Message, Chat, User } from "@/entities/chat/model/types";

export function useMe() {
  const { data, loading, error } = useQuery<{ me: User }>(GET_ME);
  return { data: data?.me, isLoading: loading, error };
}

export function useChatDetails(id: string) {
  const { data, loading, error } = useQuery<{ chat: Chat }>(GET_CHAT_BY_ID, {
    variables: { id },
    skip: !id,
  });
  return { data: data?.chat, isLoading: loading, error };
}

export function useChatHistory(chatId: string) {
  const { data, loading, ...rest } = useQuery<{ messageHistory: Message[] }>(
    GET_MESSAGE_HISTORY,
    {
      variables: { chatId, limit: 50, offset: 0 },
      skip: !chatId,
    },
  );
  return { data: data?.messageHistory ?? [], isLoading: loading, ...rest };
}

export function useChatActions(chatId: string) {
  const [send, { loading }] = useMutation<{ sendMessage: Message }>(
    SEND_MESSAGE,
  );
  const [read] = useMutation(MARK_AS_READ);

  const sendMessage = (text: string, options?: { onSuccess?: () => void }) => {
    send({
      variables: { chatId, text },
      onCompleted: () => options?.onSuccess?.(),
    });
  };

  const markAsRead = (lastMessageId: string) => {
    read({
      variables: { chatId, lastMessageId },
    });
  };

  return {
    sendMessage,
    isSending: loading,
    markAsRead,
  };
}
