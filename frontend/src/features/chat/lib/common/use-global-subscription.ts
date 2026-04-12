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
      isEdited
      sender {
        id
        firstName
        lastName
        photoUrl
        displayName
      }
      replyTo {
        id
        text
        sender {
          id
          firstName
          lastName
          displayName
        }
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
          const rootField: RecordProxy | null | undefined =
            store.getRootField("messageAdded");
          if (!rootField) return;

          const msgChatId: string = String(rootField.getValue("chatId"));
          const chatRecord: RecordProxy | null | undefined =
            store.get(msgChatId);

          if (chatRecord) {
            const sender: RecordProxy | null | undefined =
              rootField.getLinkedRecord("sender");
            const senderId: string = String(sender?.getValue("id"));
            const currentMyId: string = String(myId);

            const isFromMe: boolean = senderId === currentMyId;
            const isCurrentChatActive: boolean =
              msgChatId === activeChatRef.current &&
              document.visibilityState === "visible";

            if (!isFromMe && !isCurrentChatActive) {
              const currentUnread: number =
                Number(chatRecord.getValue("unreadCount")) || 0;
              chatRecord.setValue(currentUnread + 1, "unreadCount");
            }

            if (isFromMe) {
              chatRecord.setValue(
                rootField.getValue("sequence"),
                "myReadSequence",
              );
            }

            chatRecord.setLinkedRecord(rootField, "lastMessage");

            const history: RecordProxy | null | undefined = store
              .getRoot()
              .getLinkedRecord("messageHistory", {
                chatId: msgChatId,
                limit: 50,
                beforeSequence: null,
              });

            if (history) {
              const messages: readonly RecordProxy[] =
                (history.getLinkedRecords("messages") as
                  | readonly RecordProxy[]
                  | null) ?? [];
              if (
                !messages.some(
                  (m: RecordProxy): boolean =>
                    m.getDataID() === rootField.getDataID(),
                )
              ) {
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
          const payload: RecordProxy | null | undefined =
            store.getRootField("userStatusChanged");
          if (!payload) return;

          const uId: string = String(payload.getValue("userId"));
          const userRecord: RecordProxy | null | undefined = store.get(uId);

          if (userRecord) {
            userRecord.setValue(payload.getValue("status"), "status");
            userRecord.setValue(payload.getValue("lastSeen"), "lastSeen");
          }
        },
      }),
      [chatId],
    ),
  );

  useSubscription<useGlobalSubscriptionsTypingSubscription>(
    useMemo(
      () => ({
        subscription: typingSubscription,
        variables: { chatId: chatId ?? "" },
        skip: !chatId,
        updater: (store: RecordSourceSelectorProxy): void => {
          const payload: RecordProxy | null | undefined =
            store.getRootField("userTyping");
          if (!payload) return;

          const uId: string = String(payload.getValue("userId"));
          if (uId === String(myId)) return;

          const userRecord: RecordProxy | null | undefined = store.get(uId);
          if (userRecord) {
            userRecord.setValue(payload.getValue("isTyping"), "isTyping");
          }
        },
      }),
      [chatId, myId],
    ),
  );

  useSubscription<useGlobalSubscriptionsDialogReadSubscription>(
    useMemo(
      () => ({
        subscription: dialogReadSubscription,
        variables: { chatId: chatId ?? "" },
        skip: !chatId,
        updater: (store: RecordSourceSelectorProxy): void => {
          const payload: RecordProxy | null | undefined =
            store.getRootField("dialogRead");
          if (!payload) return;

          const cId: string = String(payload.getValue("chatId"));
          const uId: string = String(payload.getValue("userId"));
          const lastSeq: string = String(payload.getValue("lastSequence"));

          const chatRecord: RecordProxy | null | undefined = store.get(cId);
          if (chatRecord) {
            if (uId === String(myId)) {
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

  useSubscription<useGlobalSubscriptionsChatDeletedSubscription>(
    useMemo(
      () => ({
        subscription: chatDeletedSubscription,
        variables: { userId: myId ?? "" },
        skip: !myId,
        updater: (store: RecordSourceSelectorProxy): void => {
          const deletedId: string | null | undefined = store.getRootField(
            "chatDeleted",
          ) as string | null;
          if (deletedId) store.delete(deletedId);
        },
      }),
      [myId],
    ),
  );
}
