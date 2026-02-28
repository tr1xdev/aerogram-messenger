import { useSubscription, useApolloClient } from "@apollo/client/react";
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
  userStatusChanged: { userId: string; status: string };
}
interface DialogReadData {
  dialogRead: { chatID: string; userID: string; lastSequence: number };
}

export function useGlobalSubscriptions(chatId: string, myId?: string) {
  const client = useApolloClient();

  useSubscription<MessageAddedData>(MESSAGE_SUBSCRIPTION, {
    variables: { chatId },
    onData({ data }) {
      const newMessage = data.data?.messageAdded;
      if (!newMessage) return;

      const historyVars = { chatId, limit: 50, offset: 0 };

      const existing = client.readQuery<{ messageHistory: Message[] }>({
        query: GET_MESSAGE_HISTORY,
        variables: historyVars,
      });

      if (!existing?.messageHistory.some((m) => m.id === newMessage.id)) {
        client.writeQuery({
          query: GET_MESSAGE_HISTORY,
          variables: historyVars,
          data: {
            messageHistory: [
              ...(existing?.messageHistory || []),
              newMessage,
            ].sort(
              (a, b) =>
                new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
            ),
          },
        });
      }

      const chatsData = client.readQuery<{ myChats: Chat[] }>({
        query: GET_MY_CHATS,
      });
      if (chatsData) {
        const isFromMe = myId && newMessage.sender.id === myId;
        const updated = chatsData.myChats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                lastMessage: newMessage,
                unreadCount: isFromMe ? 0 : c.unreadCount + 1,
              }
            : c,
        );
        client.writeQuery({ query: GET_MY_CHATS, data: { myChats: updated } });
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
          lastReadSequence: (prev) => Math.max(prev || 0, payload.lastSequence),
          unreadCount: (prev) => (isMe ? 0 : prev),
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

      client.cache.modify({
        id: client.cache.identify({ __typename: "User", id: payload.userId }),
        fields: { status: () => payload.status },
      });
    },
  });
}
