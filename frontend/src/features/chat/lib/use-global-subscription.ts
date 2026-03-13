import {
  useSubscription,
  useApolloClient,
} from "@apollo/client/react/index.js";
import { type Reference } from "@apollo/client/index.js";
import {
  MESSAGE_SUBSCRIPTION,
  USER_PRESENCE_SUBSCRIPTION,
  DIALOG_READ_SUBSCRIPTION,
  CHAT_DELETED_SUBSCRIPTION,
  GET_MESSAGE_HISTORY,
} from "../api/chat.gql";
import type { Message } from "@/entities/chat/model/types";

interface MessageAddedData {
  messageAdded: Message;
}
interface StatusChanged {
  userStatusChanged: { userId: string; status: string; lastSeen?: string };
}
interface DialogReadData {
  dialogRead: { chatID: string; userID: string; lastSequence: number };
}
interface ChatDeletedData {
  chatDeleted: { chatId: string; forEveryone: boolean };
}

export function useGlobalSubscriptions(chatId: string, myId?: string): void {
  const client = useApolloClient();

  useSubscription<MessageAddedData>(MESSAGE_SUBSCRIPTION, {
    variables: { chatId },
    onData({ data }) {
      const newMessage = data.data?.messageAdded;
      if (!newMessage || !myId) return;

      const cache = client.cache;
      const isFromMe = newMessage.sender.id === myId;
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
                (m: Message) => m.id !== newMessage.id,
              ),
              newMessage,
            ].sort(
              (a: Message, b: Message) => (a.sequence ?? 0) - (b.sequence ?? 0),
            ),
          },
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

        cache.modify({
          fields: {
            myChats(existingRefs: readonly Reference[] = []) {
              const filtered = existingRefs.filter(
                (ref: Reference) => ref.__ref !== chatCacheId,
              );
              return [{ __ref: chatCacheId } as Reference, ...filtered];
            },
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
      const chatRef = client.cache.identify({
        __typename: "Chat",
        id: payload.chatID,
      });
      if (chatRef) {
        client.cache.modify({
          id: chatRef,
          fields: {
            lastReadSequence: (prev: number) =>
              Math.max(prev || 0, payload.lastSequence),
            unreadCount: (prev: number) =>
              myId && payload.userID === myId ? 0 : prev,
          },
        });
      }
    },
  });

  useSubscription<StatusChanged>(USER_PRESENCE_SUBSCRIPTION, {
    variables: { chatId },
    onData({ data }) {
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
            status: () => payload.status,
            lastSeen: () => payload.lastSeen,
          },
        });
      }
    },
  });

  useSubscription<ChatDeletedData>(CHAT_DELETED_SUBSCRIPTION, {
    variables: { userId: myId },
    skip: !myId,
    onData({ data }) {
      const deletedInfo = data.data?.chatDeleted;
      if (!deletedInfo) return;
      const chatCacheId = client.cache.identify({
        __typename: "Chat",
        id: deletedInfo.chatId,
      });
      if (chatCacheId) {
        client.cache.modify({
          fields: {
            myChats(existing: readonly Reference[] = [], { readField }) {
              return existing.filter(
                (ref: Reference) => readField("id", ref) !== deletedInfo.chatId,
              );
            },
          },
        });
        client.cache.evict({ id: chatCacheId });
        client.cache.gc();
      }
    },
  });
}
