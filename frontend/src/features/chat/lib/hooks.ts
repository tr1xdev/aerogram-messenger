import { useQuery, useMutation } from "@apollo/client/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  GET_MESSAGE_HISTORY,
  SEND_MESSAGE,
  GET_ME,
  GET_CHAT_BY_ID,
} from "../api/chat.gql";
import type { Chat, Message, User } from "@/entities/chat/model/types";
import { useChatSubscription } from "./use-chat-subscription";

// Get current user
export function useMe() {
  const { data, loading, error } = useQuery<{ me: User }>(GET_ME);
  return { data: data?.me, isLoading: loading, error };
}

// Get chat details by id
export function useChat(chatId?: string) {
  const { data, loading, error } = useQuery<{ chat: Chat }>(GET_CHAT_BY_ID, {
    variables: { id: chatId },
    skip: !chatId,
  });
  return { data: data?.chat, isLoading: loading, error };
}

// Get chat message history
export function useMessages(chatId?: string) {
  const { data, loading, error } = useQuery<{ messageHistory: Message[] }>(
    GET_MESSAGE_HISTORY,
    {
      variables: { chatId, limit: 50, offset: 0 },
      skip: !chatId,
    },
  );
  return { data: data?.messageHistory ?? [], isLoading: loading, error };
}

// Send message mutation
export function useSendMessage(chatId?: string) {
  const queryClient = useQueryClient();
  const [send, { loading: isPending }] = useMutation(SEND_MESSAGE, {
    onCompleted: () => {
      if (chatId)
        queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    },
  });

  const mutateAsync = async (text: string) => {
    if (!chatId) return;
    await send({ variables: { chatId, text } });
  };

  return { mutateAsync, isPending };
}

// Subscribe to messages and user status
export function useChatSubscriptionWrapper(chatId?: string) {
  return useChatSubscription(chatId ?? "");
}
