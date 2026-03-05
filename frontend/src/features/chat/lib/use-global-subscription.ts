import { useSubscription, useApolloClient } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  MESSAGE_SUBSCRIPTION,
  USER_PRESENCE_SUBSCRIPTION,
  DIALOG_READ_SUBSCRIPTION,
  GET_MESSAGE_HISTORY,
  GET_MY_CHATS,
} from "../api/chat.gql";
import type { Message, Chat, StatusChanged } from "@/entities/chat/model/types";

interface MessageAddedData {
  messageAdded: Message;
}

interface DialogReadData {
  dialogRead: { chatID: string; userID: string; lastSequence: number };
}

export function useGlobalSubscriptions(chatId: string, myId?: string) {
  const client = useApolloClient();

  useSubscription<MessageAddedData>(MESSAGE_SUBSCRIPTION, {
    variables: { chatId },
    onData({ data }) {
      const newMessage = data.data?.messageAdded;
      if (!newMessage) return;

      const historyVars = { chatId, limit: 50, offset: 0 };
      const existing = client.readQuery<{ messageHistory: Message[] }>({
        query: GET_MESSAGE_HISTORY,
        variables: historyVars,
      });

      client.writeQuery({
        query: GET_MESSAGE_HISTORY,
        variables: historyVars,
        data: {
          messageHistory: existing
            ? [
                ...existing.messageHistory.filter(
                  (m) => m.id !== newMessage.id,
                ),
                newMessage,
              ].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
            : [newMessage],
        },
      });

      const chatsData = client.readQuery<{ myChats: Chat[] }>({
        query: GET_MY_CHATS,
      });
      if (chatsData) {
        const isFromMe = myId && newMessage.sender.id === myId;
        const updated = chatsData.myChats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                lastMessage: newMessage,
                unreadCount: isFromMe ? 0 : (c.unreadCount || 0) + 1,
              }
            : c,
        );
        client.writeQuery({ query: GET_MY_CHATS, data: { myChats: updated } });
      }
    },
  });

  useSubscription<DialogReadData>(DIALOG_READ_SUBSCRIPTION, {
    variables: { chatID: chatId },
    onData({ data }) {
      const payload = data.data?.dialogRead;
      if (!payload) return;
      const isMe = myId && payload.userID === myId;

      client.cache.modify({
        id: client.cache.identify({ __typename: "Chat", id: payload.chatID }),
        fields: {
          lastReadSequence: (prev: number) =>
            Math.max(prev || 0, payload.lastSequence),
          unreadCount: (prev: number) => (isMe ? 0 : prev),
        },
      });
    },
  });

  useSubscription<StatusChanged>(USER_PRESENCE_SUBSCRIPTION, {
    variables: { chatId },
    onData({ data }) {
      const payload = data.data?.userStatusChanged;
      if (!payload) return;

      client.writeFragment({
        id: client.cache.identify({ __typename: "User", id: payload.userId }),
        fragment: gql`
          fragment UserStatusUpdate on User {
            status
            lastSeen
          }
        `,
        data: {
          status: payload.status,
          lastSeen: payload.lastSeen || null,
        },
        broadcast: true,
      });
    },
  });
}
