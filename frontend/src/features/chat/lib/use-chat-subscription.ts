import { useSubscription, useApolloClient } from "@apollo/client/react";
import type { Message } from "@/entities/chat/model/types";
import {
  MESSAGE_SUBSCRIPTION,
  USER_PRESENCE_SUBSCRIPTION,
  GET_MESSAGE_HISTORY,
} from "../api/chat.gql";

interface MessageAddedData {
  messageAdded: Message;
}

interface StatusPayload {
  userStatusChanged: {
    userId: string;
    status: string;
  };
}

interface HistoryData {
  messageHistory: Message[];
}

export function useChatSubscription(chatId: string) {
  const client = useApolloClient();

  useSubscription<MessageAddedData>(MESSAGE_SUBSCRIPTION, {
    variables: { chatId },
    onData({ data }) {
      const newMessage = data.data?.messageAdded;
      if (!newMessage) return;

      const variables = { chatId, limit: 50, offset: 0 };

      const existing = client.readQuery<HistoryData>({
        query: GET_MESSAGE_HISTORY,
        variables,
      });

      if (!existing) return;

      if (existing.messageHistory.some((m) => m.id === newMessage.id)) return;

      client.writeQuery({
        query: GET_MESSAGE_HISTORY,
        variables,
        data: {
          messageHistory: [...existing.messageHistory, newMessage],
        },
      });
    },
  });

  const { data } = useSubscription<StatusPayload>(USER_PRESENCE_SUBSCRIPTION, {
    variables: { chatId },
  });

  return { lastStatusUpdate: data?.userStatusChanged };
}
