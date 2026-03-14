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
  dialogRead: { chatId: string; userId: string; lastSequence: number };
}

export function useGlobalSubscriptions(chatId: string, myId?: string): void {
  const client = useApolloClient();

  useSubscription<MessageAddedData>(MESSAGE_SUBSCRIPTION, {
    variables: { chatId },
    onData({ data }): void {
      const newMessage: Message | undefined = data.data?.messageAdded;
      if (!newMessage) return;

      const cache: ApolloCache = client.cache;
      const isFromMe: boolean = !!(myId && newMessage.sender.id === myId);

      const historyVars: { chatId: string; limit: number; offset: number } = {
        chatId,
        limit: 50,
        offset: 0,
      };

      const existingHistory = client.readQuery<{
        messageHistory: { messages: Message[] };
      }>({
        query: GET_MESSAGE_HISTORY,
        variables: historyVars,
      });

      if (existingHistory?.messageHistory) {
        client.writeQuery({
          query: GET_MESSAGE_HISTORY,
          variables: historyVars,
          data: {
            messageHistory: {
              ...existingHistory.messageHistory,
              messages: [
                ...existingHistory.messageHistory.messages.filter(
                  (m: Message): boolean => m.id !== newMessage.id,
                ),
                newMessage,
              ].sort(
                (a: Message, b: Message): number =>
                  (a.sequence ?? 0) - (b.sequence ?? 0),
              ),
            },
          },
        });
      }

      const chatsData = client.readQuery<{ myChats: { chats: Chat[] } }>({
        query: GET_MY_CHATS,
      });

      if (chatsData?.myChats?.chats) {
        const updatedChats: Chat[] = chatsData.myChats.chats.map(
          (c: Chat): Chat => {
            if (c.id === newMessage.chatId) {
              return {
                ...c,
                lastMessage: newMessage,
                unreadCount: isFromMe
                  ? c.unreadCount
                  : (c.unreadCount || 0) + 1,
              };
            }
            return c;
          },
        );

        const sortedChats: Chat[] = [...updatedChats].sort(
          (a: Chat, b: Chat): number => {
            const timeA: number = new Date(
              a.lastMessage?.sentAt || 0,
            ).getTime();
            const timeB: number = new Date(
              b.lastMessage?.sentAt || 0,
            ).getTime();
            return timeB - timeA;
          },
        );

        client.writeQuery({
          query: GET_MY_CHATS,
          data: {
            myChats: {
              ...chatsData.myChats,
              chats: sortedChats,
            },
          },
        });
      }

      const chatCacheId: string | undefined = cache.identify({
        __typename: "Chat",
        id: newMessage.chatId,
      });

      if (chatCacheId) {
        cache.modify({
          id: chatCacheId,
          fields: {
            lastMessage: (): Message => newMessage,
            unreadCount: (prev: number): number =>
              isFromMe ? 0 : (prev || 0) + 1,
          },
        });
      }
    },
  });

  useSubscription<DialogReadData>(DIALOG_READ_SUBSCRIPTION, {
    variables: { chatId },
    onData({ data }): void {
      const payload: DialogReadData["dialogRead"] | undefined =
        data.data?.dialogRead;
      if (!payload) return;

      const cache: ApolloCache = client.cache;
      const isMe: boolean = !!(myId && payload.userId === myId);

      const chatRef: string | undefined = cache.identify({
        __typename: "Chat",
        id: payload.chatId,
      });

      if (chatRef) {
        cache.modify({
          id: chatRef,
          fields: {
            lastReadSequence: (prev: number): number =>
              Math.max(prev || 0, payload.lastSequence),
            unreadCount: (prev: number): number => (isMe ? 0 : prev),
          },
        });
      }

      const sidebar = client.readQuery<{ myChats: { chats: Chat[] } }>({
        query: GET_MY_CHATS,
      });

      if (sidebar?.myChats?.chats) {
        const updated: Chat[] = sidebar.myChats.chats.map(
          (c: Chat): Chat =>
            c.id === payload.chatId
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

        client.writeQuery({
          query: GET_MY_CHATS,
          data: {
            myChats: {
              ...sidebar.myChats,
              chats: updated,
            },
          },
        });
      }
    },
  });

  useSubscription<StatusChanged>(USER_PRESENCE_SUBSCRIPTION, {
    variables: { chatId },
    onData({ data }): void {
      const payload: StatusChanged["userStatusChanged"] | undefined =
        data.data?.userStatusChanged;
      if (!payload) return;

      const cache: ApolloCache = client.cache;
      const userRef: string | undefined = cache.identify({
        __typename: "User",
        id: payload.userId,
      });

      if (userRef) {
        cache.modify({
          id: userRef,
          fields: {
            status: (): string => payload.status,
            lastSeen: (): string | undefined => payload.lastSeen,
          },
        });
      }
    },
  });
}
