import { gql } from "@apollo/client";
import {
  useSubscription,
  useMutation,
  useApolloClient,
} from "@apollo/client/react";
import type { Reference } from "@apollo/client";
import {
  MESSAGE_SUBSCRIPTION,
  MESSAGE_READ_SUBSCRIPTION,
  MARK_AS_READ,
  GET_MY_CHATS,
} from "@/features/chat/api/chat.gql.ts";
import type { Message, Chat } from "@/entities/chat/model/types";

interface ReadPayload {
  messageRead: {
    chatID: string;
    userID: string;
    lastMessageID: string;
  };
}

interface ModifierDetails {
  storeFieldName: string;
  readField: (fieldName: string, ref: Reference) => unknown;
  toReference: (obj: object) => Reference | undefined;
}

const MARK_AS_READ_FRAGMENT = gql`
  fragment MarkAsRead on Message {
    isRead
  }
`;

export function useGlobalSubscriptions(
  activeChatId: string | null,
  currentUserId: string | undefined,
) {
  const client = useApolloClient();
  const [markAsReadMutation] = useMutation(MARK_AS_READ);

  useSubscription<{ messageAdded: Message }>(MESSAGE_SUBSCRIPTION, {
    variables: { chatId: activeChatId || "" },
    onData: ({ data }) => {
      const newMessage = data.data?.messageAdded;
      if (!newMessage) return;

      const isSelf = newMessage.sender.id === currentUserId;
      const fullMessage = {
        ...newMessage,
        isRead: isSelf,
        __typename: "Message",
      };

      client.cache.modify({
        fields: {
          messageHistory: ((
            existingRefs: readonly Reference[] = [],
            { storeFieldName, toReference }: ModifierDetails,
          ) => {
            if (storeFieldName.includes(newMessage.chatId)) {
              const newMessageRef = toReference(fullMessage);
              return newMessageRef
                ? [...existingRefs, newMessageRef]
                : existingRefs;
            }
            return existingRefs;
          }) as never,
        },
      });

      const chatsData = client.readQuery<{ myChats: Chat[] }>({
        query: GET_MY_CHATS,
      });
      if (chatsData) {
        const updated = chatsData.myChats.map((c: Chat) =>
          c.id === newMessage.chatId
            ? {
                ...c,
                lastMessage: fullMessage,
                unreadCount:
                  isSelf || c.id === activeChatId
                    ? c.unreadCount
                    : c.unreadCount + 1,
              }
            : c,
        );
        client.writeQuery({ query: GET_MY_CHATS, data: { myChats: updated } });
      }

      if (activeChatId === newMessage.chatId && !isSelf) {
        markAsReadMutation({
          variables: { chatID: activeChatId, lastMessageID: newMessage.id },
        });
      }
    },
  });

  useSubscription<ReadPayload>(MESSAGE_READ_SUBSCRIPTION, {
    variables: { chatID: activeChatId || "" },
    skip: !activeChatId,
    onData: ({ data }) => {
      const payload = data.data?.messageRead;
      if (!payload) return;

      client.cache.modify({
        fields: {
          messageHistory: ((
            existingRefs: readonly Reference[] = [],
            { readField }: ModifierDetails,
          ) => {
            const targetMsg = existingRefs.find(
              (ref) => readField("id", ref) === payload.lastMessageID,
            );

            const targetTime = targetMsg
              ? new Date(String(readField("sentAt", targetMsg))).getTime()
              : Date.now();

            return existingRefs.map((ref) => {
              const msgId = readField("id", ref);
              const msgSentAt = String(readField("sentAt", ref) || "");
              const msgTime = new Date(msgSentAt).getTime();

              if (msgId === payload.lastMessageID || msgTime <= targetTime) {
                client.cache.writeFragment({
                  id: client.cache.identify(ref),
                  fragment: MARK_AS_READ_FRAGMENT,
                  data: { isRead: true },
                });
              }
              return ref;
            });
          }) as never,
        },
      });

      const chatsData = client.readQuery<{ myChats: Chat[] }>({
        query: GET_MY_CHATS,
      });
      if (chatsData) {
        const updated = chatsData.myChats.map((c: Chat) =>
          c.id === payload.chatID
            ? {
                ...c,
                unreadCount:
                  payload.userID === currentUserId ? 0 : c.unreadCount,
              }
            : c,
        );
        client.writeQuery({ query: GET_MY_CHATS, data: { myChats: updated } });
      }
    },
  });
}
