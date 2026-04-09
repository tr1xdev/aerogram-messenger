import {
  useSubscription,
  useApolloClient,
} from "@apollo/client/react/index.js";
import {
  type Reference,
  type ApolloCache,
  type StoreObject,
} from "@apollo/client/index.js";
import { type ModifierDetails } from "@apollo/client/cache/index.js";
import { useParams } from "@tanstack/react-router";
import {
  MESSAGE_SUBSCRIPTION,
  DIALOG_READ_SUBSCRIPTION,
  CHAT_DELETED_SUBSCRIPTION,
  USER_PRESENCE_SUBSCRIPTION,
  USER_TYPING_SUBSCRIPTION,
} from "@/features/chat/api";
import type { Message } from "@/entities/chat/model/types";

interface MyChatsData {
  chats: Reference[];
  __typename?: string;
  [key: string]: unknown;
}

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

interface TypingData {
  userTyping: {
    userId: string;
    isTyping: boolean;
  };
}

export function useGlobalSubscriptions(
  chatId: string | undefined,
  myId: string | undefined,
): void {
  const client: ReturnType<typeof useApolloClient> = useApolloClient();
  const params: { chatId?: string } = useParams({ strict: false });
  const activeChatId: string | undefined = params.chatId;

  useSubscription<MessageAddedData>(MESSAGE_SUBSCRIPTION, {
    variables: { chatId: chatId ?? "" },
    skip: !chatId || !myId,
    onData({ data }): void {
      const newMessage: Message | undefined = data.data?.messageAdded;
      if (!newMessage || !myId) return;

      const cache: ApolloCache = client.cache;
      const isFromMe: boolean = newMessage.sender?.id === myId;
      const isCurrentChatActive: boolean =
        newMessage.chatId === activeChatId &&
        document.visibilityState === "visible";

      cache.modify({
        id: "ROOT_QUERY",
        fields: {
          messageHistory(
            existing: StoreObject | Reference | undefined,
            { storeFieldName, toReference, readField }: ModifierDetails,
          ): StoreObject | Reference | undefined {
            if (!existing || !storeFieldName.includes(newMessage.chatId)) {
              return existing;
            }

            const messageRef: Reference | null =
              toReference(newMessage as unknown as StoreObject) ?? null;

            if (!messageRef) return existing;

            const existingMessages: Reference[] =
              (readField("messages", existing as StoreObject) as Reference[]) ||
              [];

            const newMessageId: string | undefined = cache.identify(
              newMessage as unknown as StoreObject,
            );

            const exists: boolean = existingMessages.some(
              (ref: Reference): boolean => cache.identify(ref) === newMessageId,
            );

            if (exists) return existing;

            const newMessages: Reference[] = [
              ...existingMessages,
              messageRef,
            ].sort((a: Reference, b: Reference): number => {
              const seqA: number = (readField("sequence", a) as number) ?? 0;
              const seqB: number = (readField("sequence", b) as number) ?? 0;
              return seqA - seqB;
            });

            return {
              ...(existing as StoreObject),
              messages: newMessages,
            };
          },
        },
      });

      const chatCacheId: string | undefined = cache.identify({
        __typename: "Chat",
        id: newMessage.chatId,
      } as StoreObject);

      if (chatCacheId) {
        cache.modify({
          id: chatCacheId,
          fields: {
            lastMessage(
              existing: Reference | StoreObject | undefined,
              { readField }: ModifierDetails,
            ): Reference | Message {
              const existingSeq: number =
                (readField("sequence", existing as StoreObject) as number) ?? 0;
              const newSeq: number = newMessage.sequence ?? 0;
              return existing && existingSeq > newSeq
                ? (existing as Reference)
                : newMessage;
            },
            unreadCount(prev: number | undefined): number {
              const currentCount: number = prev ?? 0;
              if (isFromMe || isCurrentChatActive) return currentCount;
              return currentCount + 1;
            },
            myReadSequence(prev: number | undefined): number {
              const currentPrev: number = prev ?? 0;
              return isFromMe
                ? Math.max(currentPrev, newMessage.sequence ?? 0)
                : currentPrev;
            },
          },
        });

        cache.modify({
          fields: {
            myChats(
              existingData: MyChatsData | Reference | undefined,
              { readField }: ModifierDetails,
            ): MyChatsData | Reference | undefined {
              if (!existingData) return existingData;

              const chats: Reference[] =
                "chats" in (existingData as object)
                  ? (existingData as MyChatsData).chats
                  : (readField(
                      "chats",
                      existingData as StoreObject,
                    ) as Reference[]) || [];

              const chatRef: Reference = { __ref: chatCacheId };
              const filtered: Reference[] = chats.filter(
                (ref: Reference): boolean =>
                  readField("id", ref as unknown as StoreObject) !==
                  newMessage.chatId,
              );

              if ("chats" in (existingData as object)) {
                return {
                  ...(existingData as MyChatsData),
                  chats: [chatRef, ...filtered],
                };
              }

              return existingData;
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
      } as StoreObject);
      if (chatRef) {
        client.cache.modify({
          id: chatRef,
          fields: {
            lastReadSequence(prev: number = 0): number {
              return payload.userId !== myId
                ? Math.max(prev, payload.lastSequence)
                : prev;
            },
            myReadSequence(prev: number = 0): number {
              return payload.userId === myId
                ? Math.max(prev, payload.lastSequence)
                : prev;
            },
            unreadCount(prev: number = 0): number {
              return payload.userId === myId ? 0 : prev;
            },
          },
        });
      }
    },
  });

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
      } as StoreObject);
      if (userRef) {
        client.cache.modify({
          id: userRef,
          fields: {
            isTyping(): boolean {
              return payload.isTyping;
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
      const payload: StatusChanged["userStatusChanged"] | undefined =
        data.data?.userStatusChanged;
      if (!payload) return;
      const userRef: string | undefined = client.cache.identify({
        __typename: "User",
        id: payload.userId,
      } as StoreObject);
      if (userRef) {
        client.cache.modify({
          id: userRef,
          fields: {
            status(): string {
              return payload.status;
            },
            lastSeen(): string | undefined {
              return payload.lastSeen;
            },
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
      } as StoreObject);
      if (chatCacheId) {
        client.cache.modify({
          fields: {
            myChats(
              existingData: MyChatsData | Reference | undefined,
              { readField }: ModifierDetails,
            ): MyChatsData | Reference | undefined {
              if (!existingData) return existingData;

              const chats: Reference[] =
                "chats" in (existingData as object)
                  ? (existingData as MyChatsData).chats
                  : (readField(
                      "chats",
                      existingData as StoreObject,
                    ) as Reference[]) || [];

              return {
                ...(existingData as object),
                chats: chats.filter(
                  (ref: Reference): boolean =>
                    readField("id", ref as unknown as StoreObject) !==
                    deletedInfo.chatId,
                ),
              } as MyChatsData;
            },
          },
        });
        client.cache.evict({ id: chatCacheId });
        client.cache.gc();
      }
    },
  });
}
