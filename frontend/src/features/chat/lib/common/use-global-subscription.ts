import { useEffect, useMemo, useRef } from "react";
import { graphql, useSubscription } from "react-relay";
import { useParams } from "@tanstack/react-router";
import type { RecordProxy, RecordSourceSelectorProxy } from "relay-runtime";
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
        firstName
        lastName
        photoUrl
        displayName
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
  subscription useGlobalSubscriptionsTypingSubscription($chatId: ID!) {
    userTyping(chatID: $chatId) {
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
  const activeChatRef = useRef<string | undefined>(params.chatId);

  useEffect((): void => {
    activeChatRef.current = params.chatId;
  }, [params.chatId]);

  useSubscription<useGlobalSubscriptionsMessageAddedSubscription>(
    useMemo(
      () => ({
        subscription: messageSubscription,
        variables: { chatId: chatId ?? "" },
        skip: !chatId,
        updater: (store: RecordSourceSelectorProxy): void => {
          const rootField = store.getRootField("messageAdded");
          if (!rootField) return;

          const msgChatId = String(rootField.getValue("chatId"));
          const chatRecord = store.get(msgChatId);

          if (chatRecord) {
            const sender = rootField.getLinkedRecord("sender");
            const isFromMe = sender?.getValue("id") === myId;
            const isCurrentChatActive =
              msgChatId === activeChatRef.current &&
              document.visibilityState === "visible";

            if (!isFromMe && !isCurrentChatActive) {
              const currentUnread =
                (chatRecord.getValue("unreadCount") as number) ?? 0;
              chatRecord.setValue(currentUnread + 1, "unreadCount");
            }

            if (isFromMe) {
              chatRecord.setValue(
                rootField.getValue("sequence"),
                "myReadSequence",
              );
            }

            chatRecord.setLinkedRecord(rootField, "lastMessage");

            const root = store.getRoot();
            const history = root.getLinkedRecord("messageHistory", {
              chatId: msgChatId,
            });

            if (history) {
              const messages =
                (history.getLinkedRecords("messages") as
                  | readonly RecordProxy[]
                  | null
                  | undefined) ?? [];
              const payloadId = rootField.getDataID();
              const exists = messages.some((m) => m.getDataID() === payloadId);

              if (!exists) {
                history.setLinkedRecords([...messages, rootField], "messages");
              }
            }
          }
        },
      }),
      [chatId, myId],
    ),
  );

  useSubscription<useGlobalSubscriptionsPresenceSubscription>(
    useMemo(
      () => ({
        subscription: presenceSubscription,
        variables: { chatId: chatId ?? "" },
        skip: !chatId,
        updater: (store: RecordSourceSelectorProxy): void => {
          const payload = store.getRootField("userStatusChanged");
          if (!payload) return;

          const uId = String(payload.getValue("userId"));
          const userRecord = store.get(uId);

          if (userRecord) {
            userRecord.setValue(payload.getValue("status"), "status");
            userRecord.setValue(payload.getValue("lastSeen"), "lastSeen");
          }
        },
      }),
      [chatId],
    ),
  );

  useSubscription<useGlobalSubscriptionsDialogReadSubscription>(
    useMemo(
      () => ({
        subscription: dialogReadSubscription,
        variables: { chatId: chatId ?? "" },
        skip: !chatId,
        updater: (store: RecordSourceSelectorProxy): void => {
          const payload = store.getRootField("dialogRead");
          if (!payload) return;

          const cId = String(payload.getValue("chatId"));
          const uId = String(payload.getValue("userId"));
          const lastSeq = (payload.getValue("lastSequence") as number) ?? 0;

          const chatRecord = store.get(cId);

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
        skip: !chatId,
        updater: (store: RecordSourceSelectorProxy): void => {
          const payload = store.getRootField("userTyping");
          if (!payload) return;

          const uId = String(payload.getValue("userId"));
          const isTyping = payload.getValue("isTyping") as boolean;

          if (uId === myId) return;

          const userRecord = store.get(uId);

          if (userRecord) {
            userRecord.setValue(isTyping, "isTyping");
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
        skip: !myId,
        updater: (store: RecordSourceSelectorProxy): void => {
          const deletedChatId = store.getRootField("chatDeleted") as
            | string
            | null
            | undefined;

          if (deletedChatId) {
            store.delete(deletedChatId);
          }
        },
      }),
      [myId],
    ),
  );
}
