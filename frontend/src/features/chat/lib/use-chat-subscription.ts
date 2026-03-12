import {
  useSubscription,
  useApolloClient,
} from "@apollo/client/react/index.js";
import { type ApolloCache } from "@apollo/client/index.js";
import {
  MESSAGE_SUBSCRIPTION,
  USER_PRESENCE_SUBSCRIPTION,
  DIALOG_READ_SUBSCRIPTION,
  GET_MESSAGE_HISTORY,
  GET_MY_CHATS,
} from "../api/chat.gql";
import type { Message, Chat } from "@/entities/chat/model/types";

interface MessageAddedData {
  messageAdded: Message;
}

interface StatusChanged {
  userStatusChanged: { userId: string; status: string; lastSeen?: string };
}

interface DialogReadData {
  dialogRead: { chatID: string; userID: string; lastSequence: number };
}

export function useGlobalSubscriptions(chatId: string, myId?: string): void {
  const client = useApolloClient();

  useSubscription<MessageAddedData>(MESSAGE_SUBSCRIPTION, {
    variables: { chatId },
    onData({ data }) {
      const newMessage = data.data?.messageAdded;
      if (!newMessage) return;

      const cache: ApolloCache = client.cache;
      const isFromMe = myId && newMessage.sender.id === myId;

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
        const updatedChats = chatsData.myChats.map((c) => {
          if (c.id === newMessage.chatId) {
            return {
              ...c,
              lastMessage: newMessage,
              unreadCount: isFromMe ? c.unreadCount : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        });

        const sortedChats = [...updatedChats].sort((a, b) => {
          const timeA = new Date(a.lastMessage?.sentAt || 0).getTime();
          const timeB = new Date(b.lastMessage?.sentAt || 0).getTime();
          return timeB - timeA;
        });

        client.writeQuery({
          query: GET_MY_CHATS,
          data: { myChats: sortedChats },
        });
      }

      const chatCacheId = cache.identify({
        __typename: "Chat",
        id: newMessage.chatId,
      });
      if (chatCacheId) {
        cache.modify({
          id: chatCacheId,
          fields: {
            lastMessage: () => newMessage,
            unreadCount: (prev: number) => (isFromMe ? 0 : (prev || 0) + 1),
          },
        });
      }
    },
  });

  useSubscription<DialogReadData>(DIALOG_READ_SUBSCRIPTION, {
    variables: { chatID: chatId },
    onData({ data }) {
      const payload = data.data?.dialogRead;
      if (!payload) return;

      const cache: ApolloCache = client.cache;
      const isMe = myId && payload.userID === myId;

      const chatRef = cache.identify({
        __typename: "Chat",
        id: payload.chatID,
      });
      if (chatRef) {
        cache.modify({
          id: chatRef,
          fields: {
            lastReadSequence: (prev: number) =>
              Math.max(prev || 0, payload.lastSequence),
            unreadCount: (prev: number) => (isMe ? 0 : prev),
          },
        });
      }

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

      const cache: ApolloCache = client.cache;
      const userRef = cache.identify({
        __typename: "User",
        id: payload.userId,
      });

      if (userRef) {
        cache.modify({
          id: userRef,
          fields: {
            status: () => payload.status,
            lastSeen: () => payload.lastSeen,
          },
        });
      }
    },
  });
}
