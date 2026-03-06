import { useSubscription, useApolloClient } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  MESSAGE_SUBSCRIPTION,
  USER_PRESENCE_SUBSCRIPTION,
  DIALOG_READ_SUBSCRIPTION,
  CHAT_CREATED_SUBSCRIPTION,
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

interface ChatCreatedData {
  chatCreated: Chat;
}

export function useGlobalSubscriptions(chatId: string, myId?: string) {
  const client = useApolloClient();

  useSubscription<ChatCreatedData>(CHAT_CREATED_SUBSCRIPTION, {
    variables: { userId: myId },
    skip: !myId,
    onData({ data }) {
      const newChat = data.data?.chatCreated;
      if (!newChat) return;

      const chatsData = client.readQuery<{ myChats: Chat[] }>({
        query: GET_MY_CHATS,
      });

      if (chatsData) {
        if (chatsData.myChats.some((c) => c.id === newChat.id)) return;

        const updatedChats = [newChat, ...chatsData.myChats].sort((a, b) => {
          const timeA = new Date(
            a.lastMessage?.sentAt || a.createdAt,
          ).getTime();
          const timeB = new Date(
            b.lastMessage?.sentAt || b.createdAt,
          ).getTime();
          return timeB - timeA;
        });

        client.writeQuery({
          query: GET_MY_CHATS,
          data: { myChats: updatedChats },
        });
      }
    },
  });

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

      if (existingHistory) {
        client.writeQuery({
          query: GET_MESSAGE_HISTORY,
          variables: historyVars,
          data: {
            messageHistory: [
              ...existingHistory.messageHistory.filter(
                (m) => m.id !== newMessage.id,
              ),
              newMessage,
            ].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)),
          },
        });
      }

      const chatsData = client.readQuery<{ myChats: Chat[] }>({
        query: GET_MY_CHATS,
      });

      if (chatsData) {
        const isFromMe = myId && newMessage.sender.id === myId;
        const updatedChats = chatsData.myChats.map((c) => {
          if (c.id === chatId) {
            return {
              ...c,
              lastMessage: newMessage,
              unreadCount: isFromMe ? c.unreadCount : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        });

        const sortedChats = [...updatedChats].sort((a, b) => {
          const timeA = new Date(
            a.lastMessage?.sentAt || a.createdAt,
          ).getTime();
          const timeB = new Date(
            b.lastMessage?.sentAt || b.createdAt,
          ).getTime();
          return timeB - timeA;
        });

        client.writeQuery({
          query: GET_MY_CHATS,
          data: { myChats: sortedChats },
        });
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

      const sidebar = client.readQuery<{ myChats: Chat[] }>({
        query: GET_MY_CHATS,
      });
      if (sidebar) {
        const updated = sidebar.myChats.map((c) =>
          c.id === payload.chatID
            ? {
                ...c,
                lastReadSequence: Math.max(
                  c.lastReadSequence || 0,
                  payload.lastSequence,
                ),
                unreadCount: isMe ? 0 : c.unreadCount,
              }
            : c,
        );
        client.writeQuery({ query: GET_MY_CHATS, data: { myChats: updated } });
      }
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
      });
    },
  });
}
