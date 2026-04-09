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

interface MyChatsData {
  chats: Reference[];
  __typename?: string;
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

      console.log(`[SUBSCRIPTION:MESSAGE] New message ${newMessage.id}`, {
        chatId: newMessage.chatId,
        isFromMe,
        isCurrentChatActive,
        seq: newMessage.sequence,
      });

      const historyVars = {
        chatId: newMessage.chatId,
        limit: 50,
      };

      const existingHistory = cache.readQuery<{
        messageHistory: { messages: Message[] };
      }>({
        query: GET_MESSAGE_HISTORY,
        variables: historyVars,
      });

      if (existingHistory?.messageHistory) {
        cache.writeQuery({
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
              { readField }: ModifierDetails,
            ): Reference | Message | undefined => {
              const objToRead: StoreObject | undefined = existing
                ? (existing as unknown as StoreObject)
                : undefined;

              const existingSeq: number =
                (readField("sequence", objToRead) as number) ?? 0;
              const newSeq: number = newMessage.sequence ?? 0;

              return existing && existingSeq > newSeq ? existing : newMessage;
            },
            unreadCount: (prev: number | undefined): number => {
              const currentCount: number = typeof prev === "number" ? prev : 0;

              if (isFromMe) return 0;

              if (isCurrentChatActive) {
                console.log(
                  `[CACHE:MODIFY] Unread incremented (active chat). useMarkDialog will handle reset.`,
                );
                return currentCount + 1;
              }

              return currentCount + 1;
            },
            myReadSequence: (prev: number | undefined): number => {
              const currentPrev: number = typeof prev === "number" ? prev : 0;
              if (isFromMe) {
                return Math.max(currentPrev, newMessage.sequence ?? 0);
              }
              return currentPrev;
            },
          },
        });

        cache.modify({
          fields: {
            myChats(
              existingData: MyChatsData | Reference | undefined,
              { readField }: ModifierDetails,
            ): MyChatsData | Reference | undefined {
              if (!existingData || !("chats" in existingData))
                return existingData;

              const chatRef: Reference = { __ref: chatCacheId };
              const chats: Reference[] =
                (existingData as MyChatsData).chats || [];

              const filtered: Reference[] = chats.filter(
                (ref: Reference): boolean =>
                  readField("id", ref) !== newMessage.chatId,
              );

              return {
                ...existingData,
                chats: [chatRef, ...filtered],
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

      console.log(
        `[SUBSCRIPTION:READ] Event: User ${payload.userId} read seq ${payload.lastSequence}`,
      );

      const chatRef: string | undefined = client.cache.identify({
        __typename: "Chat",
        id: payload.chatId,
      });

      if (chatRef) {
        client.cache.modify({
          id: chatRef,
          fields: {
            lastReadSequence: (prev: number | undefined = 0): number => {
              const currentPrev: number = typeof prev === "number" ? prev : 0;
              if (payload.userId !== myId) {
                console.log(
                  `[CACHE:MODIFY] Peer read: ${currentPrev} -> ${payload.lastSequence}`,
                );
                return Math.max(currentPrev, payload.lastSequence);
              }
              return currentPrev;
            },
            myReadSequence: (prev: number | undefined = 0): number => {
              const currentPrev: number = typeof prev === "number" ? prev : 0;
              if (payload.userId === myId) {
                console.log(
                  `[CACHE:MODIFY] I read: ${currentPrev} -> ${payload.lastSequence}`,
                );
                return Math.max(currentPrev, payload.lastSequence);
              }
              return currentPrev;
            },
            unreadCount: (prev: number | undefined = 0): number => {
              if (payload.userId === myId) {
                return 0;
              }
              return typeof prev === "number" ? prev : 0;
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
              existingData: MyChatsData | Reference | undefined,
              { readField }: ModifierDetails,
            ): MyChatsData | Reference | undefined {
              if (!existingData || !("chats" in existingData))
                return existingData;

              return {
                ...existingData,
                chats: (existingData as MyChatsData).chats.filter(
                  (ref: Reference): boolean =>
                    readField("id", ref) !== deletedInfo.chatId,
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
