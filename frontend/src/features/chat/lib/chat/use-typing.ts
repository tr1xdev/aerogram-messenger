import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { graphql, useSubscription, useMutation } from "react-relay";
import type { RecordSourceSelectorProxy } from "relay-runtime";
import type {
  useTypingSubscription as useTypingSubscriptionType,
  useTypingSubscription$data,
  useTypingSubscription$variables,
} from "./__generated__/useTypingSubscription.graphql";
import type { useTypingSendMutation } from "./__generated__/useTypingSendMutation.graphql";

const typingSubscription = graphql`
  subscription useTypingSubscription($chatID: ID!) {
    userTyping(chatID: $chatID) {
      userId
      isTyping
    }
  }
`;

const sendTypingMutation = graphql`
  mutation useTypingSendMutation($chatID: ID!, $typing: Boolean!) {
    sendTypingEvent(chatID: $chatID, typing: $typing)
  }
`;

export function useTypingSubscription(
  chatId: string,
  myId: string | undefined,
  chatType?: "PRIVATE" | "GROUP" | "CHANNEL",
): boolean {
  const [prevChatId, setPrevChatId] = useState<string>(chatId);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  if (chatId !== prevChatId) {
    setPrevChatId(chatId);
    setTypingUsers(new Set());
  }

  const subscriptionConfig = useMemo(
    () => ({
      subscription: typingSubscription,
      variables: ({ chatID: chatId } as useTypingSubscription$variables),
      onNext: (
        response: useTypingSubscription$data | null | undefined,
      ): void => {
        if (!response?.userTyping) return;

        const userId = String(response.userTyping.userId);
        const isTyping = Boolean(response.userTyping.isTyping);

        if (myId && userId === String(myId)) return;

        setTypingUsers((prev) => {
          const next = new Set(prev);
          if (isTyping) {
            next.add(userId);
          } else {
            next.delete(userId);
          }
          return next;
        });
      },
      updater: (
        store: RecordSourceSelectorProxy<useTypingSubscription$data>,
      ): void => {
        const payload = store.getRootField("userTyping");
        if (!payload) return;

        const userId = String(payload.getValue("userId"));
        const isTyping = Boolean(payload.getValue("isTyping"));

        if (myId && userId === String(myId)) return;

        if (chatType === "PRIVATE") {
          const userRecord = store.get(userId);
          if (userRecord) {
            userRecord.setValue(isTyping, "isTyping");
          }
        }
      },
    }),
    [chatId, myId, chatType],
  );

  useSubscription<useTypingSubscriptionType>(subscriptionConfig);

  return typingUsers.size > 0;
}

export function useSendTyping(chatId: string): {
  handleKeyPress: () => void;
  stopTyping: () => void;
} {
  const [commit] = useMutation<useTypingSendMutation>(sendTypingMutation);
  const isTypingRef = useRef<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendTypingStatus = useCallback(
    (status: boolean): void => {
      if (isTypingRef.current === status) return;

      isTypingRef.current = status;
      commit({
        variables: {
          chatID: chatId,
          typing: status,
        },
      });
    },
    [chatId, commit],
  );

  const handleKeyPress = useCallback((): void => {
    sendTypingStatus(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout((): void => {
      sendTypingStatus(false);
    }, 3000);
  }, [sendTypingStatus]);

  const stopTyping = useCallback((): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    sendTypingStatus(false);
  }, [sendTypingStatus]);

  useEffect((): (() => void) => {
    return (): void => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { handleKeyPress, stopTyping };
}
