import {
  useSubscription,
  useApolloClient,
} from "@apollo/client/react/index.js";
import {
  type Reference,
  type ApolloCache,
  type StoreObject,
} from "@apollo/client/index.js";
import {
  MESSAGE_SUBSCRIPTION,
  DIALOG_READ_SUBSCRIPTION,
  CHAT_DELETED_SUBSCRIPTION,
  USER_PRESENCE_SUBSCRIPTION,
  USER_TYPING_SUBSCRIPTION,
  GET_MESSAGE_HISTORY,
} from "@/features/chat/api";
import type { Message } from "@/entities/chat/model/types";

interface MessageAddedData {
  messageAdded: Message;
}

interface StatusChanged {
  userStatusChanged: { userId: string; status: string; lastSeen?: string };
}

interface DialogReadData {
  dialogRead: { chatId: string; userId: string };
}

interface ChatDeletedData {
  chatDeleted: { chatId: string; forEveryone: boolean };
}

interface TypingData {
  userTyping: {
    userId: string;
    isTyping: boolean;
  };
}

interface MyChatsData {
  chats: Reference[];
  __typename?: string;
}

export function useGlobalSubscriptions(
  chatId: string | undefined,
  myId: string | undefined,
): void {
  const client: ReturnType<typeof useApolloClient> = useApolloClient();

  useSubscription<TypingData>(USER_TYPING_SUBSCRIPTION, {
    variables: { chatID: chatId ?? "" },
    skip: !chatId,
    onData({ data }): void {
      const payload: TypingData["userTyping"] | undefined =
        data.data?.userTyping;
      if (!payload || payload.userId === myId) return;

      const userRef: string | undefined = client.cache.identify({
        __typename: "User",
        id: payload.userId,
      });

      if (userRef) {
        client.cache.modify({
          id: userRef,
          fields: {
            isTyping: (): boolean => payload.isTyping,
          },
        });
      }
    },
  });

  useSubscription<MessageAddedData>(MESSAGE_SUBSCRIPTION, {
    variables: { chatId: chatId ?? "" },
    skip: !chatId || !myId,
    onData({ data }): void {
      const newMessage: Message | undefined = data.data?.messageAdded;
      if (!newMessage || !myId || !chatId) return;

      console.log("--- [SUBSCRIPTION] New Message Received ---");
      console.log("From Me:", newMessage.sender.id === myId);
      console.log("Text:", newMessage.text);
      console.log("Sequence:", newMessage.sequence);

      const cache: ApolloCache = client.cache;
      const isFromMe: boolean = newMessage.sender.id === myId;
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

      const chatCacheId: string | undefined = cache.identify({
        __typename: "Chat",
        id: newMessage.chatId,
      });

      if (chatCacheId) {
        cache.modify({
          id: chatCacheId,
          fields: {
            lastMessage: (
              existing: Reference | Message | undefined,
              { readField },
            ): Reference | Message | undefined => {
              const existingObj: Record<string, unknown> | undefined =
                existing as unknown as Record<string, unknown>;

              const existingSeq: number =
                (readField(
                  "sequence",
                  existingObj as unknown as StoreObject,
                ) as number) ?? 0;
              const newSeq: number = newMessage.sequence ?? 0;

              console.log(`[CACHE MODIFY] Chat: ${newMessage.chatId}`);
              console.log(`Existing Seq: ${existingSeq}, New Seq: ${newSeq}`);

              if (existing && existingSeq > newSeq) {
                console.warn(
                  "Rejected: Existing message is newer than subscription message.",
                );
                return existing;
              }

              console.log("Accepted: Updating lastMessage in cache.");
              return newMessage;
            },
            unreadCount: (prev: number): number => {
              if (newMessage.chatId === chatId) return 0;
              return isFromMe ? 0 : (prev || 0) + 1;
            },
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
              const filteredChats: Reference[] = existingData.chats.filter(
                (ref: Reference): boolean => ref.__ref !== chatCacheId,
              );

              return {
                ...existingData,
                chats: [chatRef, ...filteredChats],
              };
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
      const payload: DialogReadData["dialogRead"] | undefined =
        data.data?.dialogRead;
      if (!payload) return;

      const chatRef: string | undefined = client.cache.identify({
        __typename: "Chat",
        id: payload.chatId,
      });

      if (chatRef) {
        client.cache.modify({
          id: chatRef,
          fields: {
            unreadCount: (prev: number): number =>
              myId && payload.userId === myId ? 0 : prev,
          },
        });
      }
    },
  });

  useSubscription<StatusChanged>(USER_PRESENCE_SUBSCRIPTION, {
    variables: { chatId: chatId ?? "" },
    skip: !chatId,
    onData({ data }): void {
      const payload: StatusChanged["userStatusChanged"] | undefined =
        data.data?.userStatusChanged;
      if (!payload) return;

      const userRef: string | undefined = client.cache.identify({
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
      const deletedInfo: ChatDeletedData["chatDeleted"] | undefined =
        data.data?.chatDeleted;
      if (!deletedInfo) return;

      const chatCacheId: string | undefined = client.cache.identify({
        __typename: "Chat",
        id: deletedInfo.chatId,
      });

      if (chatCacheId) {
        client.cache.modify({
          fields: {
            myChats(
              existingData: MyChatsData | Reference,
              options: {
                readField: (
                  fieldName: string,
                  obj?: Reference | StoreObject,
                ) => unknown;
              },
            ): MyChatsData | Reference {
              if (!existingData || !("chats" in existingData))
                return existingData;

              return {
                ...existingData,
                chats: existingData.chats.filter(
                  (ref: Reference): boolean =>
                    options.readField("id", ref) !== deletedInfo.chatId,
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
