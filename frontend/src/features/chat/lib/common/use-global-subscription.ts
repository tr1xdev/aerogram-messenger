import { useEffect, useMemo, useRef } from "react";
import { graphql, useSubscription } from "react-relay";
import { useParams } from "@tanstack/react-router";
import type { RecordProxy, RecordSourceSelectorProxy } from "relay-runtime";
import type {
  useGlobalSubscriptionsMessageAddedSubscription,
  useGlobalSubscriptionsMessageAddedSubscription$data,
} from "./__generated__/useGlobalSubscriptionsMessageAddedSubscription.graphql";
import type { useGlobalSubscriptionsPresenceSubscription } from "./__generated__/useGlobalSubscriptionsPresenceSubscription.graphql";
import type { useGlobalSubscriptionsDialogReadSubscription } from "./__generated__/useGlobalSubscriptionsDialogReadSubscription.graphql";
import type { useGlobalSubscriptionsTypingSubscription } from "./__generated__/useGlobalSubscriptionsTypingSubscription.graphql";
import type { useGlobalSubscriptionsChatDeletedSubscription } from "./__generated__/useGlobalSubscriptionsChatDeletedSubscription.graphql";
import { logger } from "@/shared/lib/logger";
import { deleteFromChatList } from "@/features/chat/lib/chat/use-chat-management";
import type { useGlobalSubscriptionsMessageDeletedSubscription } from "./__generated__/useGlobalSubscriptionsMessageDeletedSubscription.graphql";

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

const messageDeletedSubscription = graphql`
  subscription useGlobalSubscriptionsMessageDeletedSubscription($chatId: ID!) {
    messageDeleted(chatId: $chatId)
  }
`;

function extractUuid(id: string | undefined): string {
  if (!id) return "";
  if (id.includes("-") && !id.includes(":")) return id;
  try {
    const decoded = atob(id);
    if (decoded.includes(":")) {
      return decoded.split(":")[1] || id;
    }
  } catch {
    return id;
  }
  return id;
}

function isSameId(idA: string | undefined, idB: string | undefined): boolean {
  if (!idA || !idB) return false;
  return extractUuid(idA) === extractUuid(idB);
}

export function useGlobalSubscriptions(
  chatId: string | undefined,
  myId: string | undefined,
  chatType?: "PRIVATE" | "GROUP" | "CHANNEL",
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
        onNext: (
          response:
            | useGlobalSubscriptionsMessageAddedSubscription$data
            | null
            | undefined,
        ): void => {
          logger.ws("New message received", response);
        },
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
            const isFromMe: boolean = isSameId(senderId, myId);

            const isCurrentChatActive: boolean =
              msgChatId === activeChatRef.current &&
              document.visibilityState === "visible";

            if (!isFromMe && !isCurrentChatActive) {
              const currentUnread: number =
                document.visibilityState === "visible"
                  ? Number(chatRecord.getValue("unreadCount")) || 0
                  : 0;
              chatRecord.setValue(currentUnread + 1, "unreadCount");
            }

            if (isFromMe) {
              const currentSequence: number = Number(
                rootField.getValue("sequence") ?? 0,
              );
              chatRecord.setValue(currentSequence, "myReadSequence");
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
              const messages: readonly (RecordProxy | null)[] =
                (history.getLinkedRecords(
                  "messages",
                ) as (RecordProxy | null)[]) ?? [];
              const messageId: string = rootField.getDataID();

              if (
                !messages.some(
                  (m): boolean => m != null && m.getDataID() === messageId,
                )
              ) {
                history.setLinkedRecords(
                  [
                    ...messages.filter((m): m is RecordProxy => m != null),
                    rootField,
                  ],
                  "messages",
                );
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
            logger.debug("WS", `Status updated for user: ${uId}`);
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
          if (isSameId(uId, myId)) return;

          if (chatType === "PRIVATE") {
            const userRecord: RecordProxy | null | undefined = store.get(uId);
            if (userRecord) {
              userRecord.setValue(payload.getValue("isTyping"), "isTyping");
            }
          }
        },
      }),
      [chatId, myId, chatType],
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
          const lastSeq: number = Number(payload.getValue("lastSequence") ?? 0);

          const chatRecord: RecordProxy | null | undefined = store.get(cId);
          if (chatRecord) {
            if (isSameId(uId, myId)) {
              chatRecord.setValue(0, "unreadCount");
              chatRecord.setValue(lastSeq, "myReadSequence");
            } else {
              chatRecord.setValue(lastSeq, "lastReadSequence");
            }
            logger.debug("WS", `Read sequence updated for chat: ${cId}`);
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
          const root = store.getRoot();
          const deletedId = root.getValue("chatDeleted") as
            | string
            | null
            | undefined;
          if (typeof deletedId !== "string") return;
          deleteFromChatList(store, deletedId);
          store.delete(deletedId);
          logger.warn("APP", `Chat removed from store: ${deletedId}`);
        },
      }),
      [myId],
    ),
  );

  useSubscription<useGlobalSubscriptionsMessageDeletedSubscription>(
    useMemo(
      () => ({
        subscription: messageDeletedSubscription,
        variables: { chatId: chatId ?? "" },
        skip: !chatId,
        updater: (store: RecordSourceSelectorProxy): void => {
          if (!chatId) return;
          const root = store.getRoot();
          const deletedId = root.getValue("messageDeleted") as
            | string
            | null
            | undefined;
          if (typeof deletedId !== "string") return;

          store.delete(deletedId);

          const chatRecord = store.get(chatId);
          if (chatRecord) {
            chatRecord.invalidateRecord();
          }
        },
      }),
      [chatId],
    ),
  );
}
