import {
  useSubscription,
  useApolloClient,
} from "@apollo/client/react/index.js";
import { type Reference, type ApolloCache } from "@apollo/client/index.js";
import {
  MESSAGE_SUBSCRIPTION,
  DIALOG_READ_SUBSCRIPTION,
  CHAT_DELETED_SUBSCRIPTION,
  USER_PRESENCE_SUBSCRIPTION,
  GET_MESSAGE_HISTORY,
} from "../api";
import type { Message } from "@/entities/chat/model/types";

interface MessageAddedData {
  messageAdded: Message;
}

interface StatusChanged {
  userStatusChanged: { userId: string; status: string; lastSeen?: string };
}

interface DialogReadData {
  dialogRead: { chatId: string; userId: string; lastSequence: number };
}

interface ChatDeletedData {
  chatDeleted: { chatId: string; forEveryone: boolean };
}

interface MyChatsData {
  chats: Reference[];
  __typename?: string;
}

export function useGlobalSubscriptions(
  chatId: string | undefined,
  myId: string | undefined,
): void {
  const client = useApolloClient();

  useSubscription<MessageAddedData>(MESSAGE_SUBSCRIPTION, {
    variables: { chatId: chatId ?? "" },
    skip: !chatId || !myId,
    onData({ data }): void {
      const newMessage: Message | undefined = data.data?.messageAdded;
      if (!newMessage || !myId || !chatId) return;

      const cache: ApolloCache = client.cache;
      const isFromMe: boolean = newMessage.sender.id === myId;
      const historyVars = { chatId, limit: 50, offset: 0 };

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

        cache.modify({
          fields: {
            myChats(
              existingData: MyChatsData | Reference,
            ): MyChatsData | Reference {
              if (!existingData || !("chats" in existingData))
                return existingData;
              const chatRef: Reference = { __ref: chatCacheId };
              const filteredChats = existingData.chats.filter(
                (ref: Reference): boolean => ref.__ref !== chatCacheId,
              );
              return { ...existingData, chats: [chatRef, ...filteredChats] };
            },
          },
        });
      }
    },
  });

  useSubscription<DialogReadData>(DIALOG_READ_SUBSCRIPTION, {
    variables: { chatId: chatId ?? "" },
    skip: !chatId,
    onData({ data }): void {
      const payload = data.data?.dialogRead;
      if (!payload) return;

      const cache = client.cache;
      const isMe = myId && payload.userId === myId;

      const chatRef = cache.identify({
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

      const historyVars = { chatId: payload.chatId, limit: 50, offset: 0 };
      const historyData = cache.readQuery<{
        messageHistory: { messages: Message[] };
      }>({
        query: GET_MESSAGE_HISTORY,
        variables: historyVars,
      });

      if (historyData?.messageHistory?.messages) {
        const updatedMessages = historyData.messageHistory.messages.map((m) => {
          if ((m.sequence ?? 0) <= payload.lastSequence && !m.isRead) {
            return { ...m, isRead: true };
          }
          return m;
        });

        cache.writeQuery({
          query: GET_MESSAGE_HISTORY,
          variables: historyVars,
          data: {
            messageHistory: {
              ...historyData.messageHistory,
              messages: updatedMessages,
            },
          },
        });
      }
    },
  });

  useSubscription<StatusChanged>(USER_PRESENCE_SUBSCRIPTION, {
    variables: { chatId: chatId ?? "" },
    skip: !chatId,
    onData({ data }): void {
      const payload = data.data?.userStatusChanged;
      if (!payload) return;

      const userRef = client.cache.identify({
        __typename: "User",
        id: payload.userId,
      });

      if (userRef) {
        client.cache.modify({
          id: userRef,
          fields: {
            status: (): string => payload.status,
            lastSeen: (): string | undefined => payload.lastSeen,
          },
        });
      }
    },
  });

  useSubscription<ChatDeletedData>(CHAT_DELETED_SUBSCRIPTION, {
    variables: { userId: myId ?? "" },
    skip: !myId,
    onData({ data }): void {
      const deletedInfo = data.data?.chatDeleted;
      if (!deletedInfo) return;

      const chatCacheId = client.cache.identify({
        __typename: "Chat",
        id: deletedInfo.chatId,
      });

      if (chatCacheId) {
        client.cache.modify({
          fields: {
            myChats(
              existingData: MyChatsData | Reference,
              { readField },
            ): MyChatsData | Reference {
              if (!existingData || !("chats" in existingData))
                return existingData;
              return {
                ...existingData,
                chats: existingData.chats.filter(
                  (ref) => readField("id", ref) !== deletedInfo.chatId,
                ),
              };
            },
          },
        });
        client.cache.evict({ id: chatCacheId });
        client.cache.gc();
      }
    },
  });
}
