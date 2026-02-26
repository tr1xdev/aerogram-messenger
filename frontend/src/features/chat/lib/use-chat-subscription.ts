import { useSubscription, useApolloClient } from "@apollo/client/react";
import type { Message, Chat } from "@/entities/chat/model/types";
import {
  MESSAGE_SUBSCRIPTION,
  USER_PRESENCE_SUBSCRIPTION,
  GET_MESSAGE_HISTORY,
  GET_MY_CHATS,
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

export function useChatSubscription(chatId: string) {
  const client = useApolloClient();

  useSubscription<MessageAddedData>(MESSAGE_SUBSCRIPTION, {
    variables: { chatId },
    onData({ data }) {
      const newMessage = data.data?.messageAdded;
      if (!newMessage) return;

      const historyVars = { chatId, limit: 50, offset: 0 };
      const existingHistory = client.readQuery<{ messageHistory: Message[] }>({
        query: GET_MESSAGE_HISTORY,
        variables: historyVars,
      });

      if (
        existingHistory &&
        !existingHistory.messageHistory.some((m) => m.id === newMessage.id)
      ) {
        client.writeQuery({
          query: GET_MESSAGE_HISTORY,
          variables: historyVars,
          data: {
            messageHistory: [...existingHistory.messageHistory, newMessage],
          },
        });
      }

      const chatsData = client.readQuery<{ myChats: Chat[] }>({
        query: GET_MY_CHATS,
      });
      if (!chatsData) return;

      const updatedChats = chatsData.myChats.map((c) =>
        c.id === chatId
          ? { ...c, lastMessage: newMessage, unreadCount: c.unreadCount + 1 }
          : c,
      );

      client.writeQuery({
        query: GET_MY_CHATS,
        data: { myChats: updatedChats },
      });
    },
  });

  useSubscription<StatusPayload>(USER_PRESENCE_SUBSCRIPTION, {
    variables: { chatId },
    onData({ data }) {
      const payload = data.data?.userStatusChanged;
      if (!payload) return;

      const chatsData = client.readQuery<{ myChats: Chat[] }>({
        query: GET_MY_CHATS,
      });
      if (!chatsData) return;

      const updatedChats = chatsData.myChats.map((c) =>
        c.lastMessage?.sender.id === payload.userId
          ? {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                sender: { ...c.lastMessage.sender, status: payload.status },
              },
            }
          : c,
      );

      client.writeQuery({
        query: GET_MY_CHATS,
        data: { myChats: updatedChats },
      });
    },
  });
}
