import {
  useQuery,
  useMutation,
  type MutationHookOptions,
} from "@apollo/client/react";
import {
  SEND_MESSAGE,
  MARK_AS_READ,
  GET_MESSAGE_HISTORY,
  GET_ME,
  GET_CHAT_BY_ID,
} from "../api/chat.gql";
import type { Message, User, Chat } from "@/entities/chat/model/types";

export function useMe() {
  return useQuery<{ me: User }>(GET_ME);
}

export function useChatDetails(id: string) {
  return useQuery<{ chat: Chat }>(GET_CHAT_BY_ID, {
    variables: { id },
    skip: !id,
  });
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
  const [read] = useMutation<{ markAsRead: boolean }>(MARK_AS_READ);

  const sendMessage = (
    text: string,
    options?: MutationHookOptions<{ sendMessage: Message }>,
  ) => {
    return send({
      variables: { chatId, text },
      ...options,
    });
  };

  const markAsRead = (lastMessageId: string) => {
    return read({
      variables: { chatID: chatId, lastMessageID: lastMessageId },
    });
  };

  return { sendMessage, isSending: loading, markAsRead };
}
