import { useMemo } from "react";
import { graphql, useSubscription } from "react-relay";
import { useParams } from "@tanstack/react-router";
import type { useGlobalSubscriptionsMessageAddedSubscription } from "./__generated__/useGlobalSubscriptionsMessageAddedSubscription.graphql";
import type { useGlobalSubscriptionsPresenceSubscription } from "./__generated__/useGlobalSubscriptionsPresenceSubscription.graphql";
import type { useGlobalSubscriptionsDialogReadSubscription } from "./__generated__/useGlobalSubscriptionsDialogReadSubscription.graphql";
import type { useGlobalSubscriptionsTypingSubscription } from "./__generated__/useGlobalSubscriptionsTypingSubscription.graphql";
import type { useGlobalSubscriptionsChatDeletedSubscription } from "./__generated__/useGlobalSubscriptionsChatDeletedSubscription.graphql";

const messageSubscription = graphql`
  subscription useGlobalSubscriptionsMessageAddedSubscription($chatId: ID!) {
    messageAdded(chatId: $chatId) {
      id
      chatId
      text
      sentAt
      sequence
      sender {
        id
      }
    }
  }
`;

const presenceSubscription = graphql`
  subscription useGlobalSubscriptionsPresenceSubscription($chatId: ID!) {
    userStatusChanged(chatId: $chatId) {
      userId
      status
      lastSeen
    }
  }
`;

const dialogReadSubscription = graphql`
  subscription useGlobalSubscriptionsDialogReadSubscription($chatId: ID!) {
    dialogRead(chatId: $chatId) {
      chatId
      userId
      lastSequence
    }
  }
`;

const typingSubscription = graphql`
  subscription useGlobalSubscriptionsTypingSubscription($chatID: ID!) {
    userTyping(chatID: $chatID) {
      userId
      isTyping
    }
  }
`;

const chatDeletedSubscription = graphql`
  subscription useGlobalSubscriptionsChatDeletedSubscription($userId: ID!) {
    chatDeleted(userId: $userId)
  }
`;

export function useGlobalSubscriptions(
  chatId: string | undefined,
  myId: string | undefined,
): void {
  const params: { chatId?: string } = useParams({ strict: false });
  const activeChatId = params.chatId;

  useSubscription<useGlobalSubscriptionsMessageAddedSubscription>(
    useMemo(
      () => ({
        subscription: messageSubscription,
        variables: { chatId: chatId ?? "" },
        updater: (store) => {
          const rootField = store.getRootField("messageAdded");
          if (!rootField) return;

          const msgChatId = rootField.getValue("chatId");
          const sender = rootField.getLinkedRecord("sender");
          const isFromMe = sender?.getValue("id") === myId;
          const isCurrentChatActive =
            msgChatId === activeChatId &&
            document.visibilityState === "visible";

          const chatRecord = store.get(String(msgChatId));
          if (chatRecord) {
            const currentUnread =
              (chatRecord.getValue("unreadCount") as number) ?? 0;
            if (!isFromMe && !isCurrentChatActive) {
              chatRecord.setValue(currentUnread + 1, "unreadCount");
            }
            if (isFromMe) {
              chatRecord.setValue(
                rootField.getValue("sequence"),
                "myReadSequence",
              );
            }
            chatRecord.setLinkedRecord(rootField, "lastMessage");
          }
        },
      }),
      [chatId, myId, activeChatId],
    ),
  );

  useSubscription<useGlobalSubscriptionsPresenceSubscription>(
    useMemo(
      () => ({
        subscription: presenceSubscription,
        variables: { chatId: chatId ?? "" },
      }),
      [chatId],
    ),
  );

  useSubscription<useGlobalSubscriptionsDialogReadSubscription>(
    useMemo(
      () => ({
        subscription: dialogReadSubscription,
        variables: { chatId: chatId ?? "" },
        updater: (store) => {
          const payload = store.getRootField("dialogRead");
          if (!payload) return;

          const cId = payload.getValue("chatId");
          const uId = payload.getValue("userId");
          const lastSeq = payload.getValue("lastSequence");
          const chatRecord = store.get(String(cId));

          if (chatRecord) {
            if (uId === myId) {
              chatRecord.setValue(0, "unreadCount");
              chatRecord.setValue(lastSeq, "myReadSequence");
            } else {
              chatRecord.setValue(lastSeq, "lastReadSequence");
            }
          }
        },
      }),
      [chatId, myId],
    ),
  );

  useSubscription<useGlobalSubscriptionsTypingSubscription>(
    useMemo(
      () => ({
        subscription: typingSubscription,
        variables: { chatID: chatId ?? "" },
        updater: (store) => {
          const payload = store.getRootField("userTyping");
          if (!payload) return;
          const uId = payload.getValue("userId");
          if (uId === myId) return;

          const userRecord = store.get(String(uId));
          if (userRecord) {
            userRecord.setValue(payload.getValue("isTyping"), "isTyping");
          }
        },
      }),
      [chatId, myId],
    ),
  );

  useSubscription<useGlobalSubscriptionsChatDeletedSubscription>(
    useMemo(
      () => ({
        subscription: chatDeletedSubscription,
        variables: { userId: myId ?? "" },
        updater: (store) => {
          const deletedChatId = store
            .getRootField("chatDeleted")
            ?.getValue("id");
          if (deletedChatId) {
            store.delete(String(deletedChatId));
          }
        },
      }),
      [myId],
    ),
  );
}
