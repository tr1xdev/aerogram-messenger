import {
  useSubscription,
  useApolloClient,
} from "@apollo/client/react/index.js";
import { type ApolloCache } from "@apollo/client/index.js";
import {
  MESSAGE_SUBSCRIPTION,
  USER_PRESENCE_SUBSCRIPTION,
  DIALOG_READ_SUBSCRIPTION,
  CHAT_DELETED_SUBSCRIPTION,
  GET_MESSAGE_HISTORY,
  GET_MY_CHATS,
  GET_CHAT_DETAILS,
} from "../api/chat.gql";
import { decryptText, getPrivateKey } from "@/shared/lib/crypto";
import type {
  Message,
  Chat,
  User,
  ChatMember,
} from "@/entities/chat/model/types";

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
  const client: ReturnType<typeof useApolloClient> = useApolloClient();

  useSubscription<MessageAddedData>(MESSAGE_SUBSCRIPTION, {
    variables: { chatId },
    async onData({ data }) {
      const newMessage: Message | undefined = data.data?.messageAdded;
      if (!newMessage || !myId) return;

      const cache: ApolloCache = client.cache;
      const myPrivKey: CryptoKey | null = await getPrivateKey(myId);
      let decryptedText: string = newMessage.text;

      if (newMessage.isEncrypted && newMessage.encryptionIv && myPrivKey) {
        try {
          const chatCacheData = client.readQuery<{ chat: Chat }>({
            query: GET_CHAT_DETAILS,
            variables: { id: newMessage.chatId, slug: null },
          });

          const peer: User | undefined = chatCacheData?.chat.members?.find(
            (m: ChatMember) => m.user.id !== myId,
          )?.user;

          if (peer?.publicKey) {
            decryptedText = await decryptText(
              newMessage.text,
              newMessage.encryptionIv,
              peer.publicKey,
              myPrivKey,
            );
          }
        } catch (e: unknown) {
          console.error(e);
        }
      }

      const displayMessage: Message = {
        ...newMessage,
        text: decryptedText,
      };

      const isFromMe: boolean = newMessage.sender.id === myId;
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
                (m: Message) => m.id !== displayMessage.id,
              ),
              displayMessage,
            ].sort(
              (a: Message, b: Message) => (a.sequence ?? 0) - (b.sequence ?? 0),
            ),
          },
        });
      }

      const chatCacheId: string | undefined = cache.identify({
        __typename: "Chat",
        id: displayMessage.chatId,
      });

      if (chatCacheId) {
        cache.modify({
          id: chatCacheId,
          fields: {
            lastMessage: () => displayMessage,
            unreadCount: (prev: number) => (isFromMe ? 0 : (prev || 0) + 1),
          },
        });
      }

      const chatsData = client.readQuery<{ myChats: Chat[] }>({
        query: GET_MY_CHATS,
      });

      if (chatsData && chatCacheId) {
        const updatedChats: Chat[] = chatsData.myChats.map((c: Chat) => {
          if (c.id === displayMessage.chatId) {
            return {
              ...c,
              lastMessage: displayMessage,
              unreadCount: isFromMe ? c.unreadCount : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        });

        const sortedChats: Chat[] = [...updatedChats].sort(
          (a: Chat, b: Chat) => {
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
          data: { myChats: sortedChats },
        });
      }
    },
  });

  useSubscription<DialogReadData>(DIALOG_READ_SUBSCRIPTION, {
    variables: { chatID: chatId },
    onData({ data }) {
      const payload: DialogReadData["dialogRead"] | undefined =
        data.data?.dialogRead;
      if (!payload) return;

      const cache: ApolloCache = client.cache;
      const isMe: boolean = !!(myId && payload.userID === myId);
      const chatRef: string | undefined = cache.identify({
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
    },
  });

  useSubscription<StatusChanged>(USER_PRESENCE_SUBSCRIPTION, {
    variables: { chatId },
    onData({ data }) {
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
      const deletedInfo: ChatDeletedData["chatDeleted"] | undefined =
        data.data?.chatDeleted;
      if (!deletedInfo) return;

      const cache: ApolloCache = client.cache;
      const chatCacheId: string | undefined = cache.identify({
        __typename: "Chat",
        id: deletedInfo.chatId,
      });

      if (chatCacheId) {
        cache.evict({ id: chatCacheId });
        cache.gc();
      }
    },
  });
}
