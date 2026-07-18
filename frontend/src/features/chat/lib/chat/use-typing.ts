import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { graphql, useSubscription, useMutation, useRelayEnvironment } from "react-relay";
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

interface TypingUser {
  id: string;
  name: string;
}

export interface TypingStatus {
  text: string;
  showDots: boolean;
}

export function useTypingSubscription(
  chatId: string,
  myId: string | undefined,
  chatType?: "PRIVATE" | "GROUP" | "CHANNEL",
): TypingStatus | null {
  const environment = useRelayEnvironment();
  const [prevChatId, setPrevChatId] = useState<string>(chatId);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  if (chatId !== prevChatId) {
    setPrevChatId(chatId);
    setTypingUsers([]);
  }

  const subscriptionConfig = useMemo(
    () => ({
      subscription: typingSubscription,
      variables: { chatID: chatId } as useTypingSubscription$variables,
      onNext: (
        response: useTypingSubscription$data | null | undefined,
      ): void => {
        if (!response?.userTyping) return;

        const userId = String(response.userTyping.userId);
        const isTyping = Boolean(response.userTyping.isTyping);

        if (myId && userId === String(myId)) return;

        let userName = "Someone";
        const userRecord = environment.getStore().getSource().get(userId);
        if (userRecord && userRecord.displayName) {
          userName = String(userRecord.displayName);
        }

        setTypingUsers((prev) => {
          const filtered = prev.filter((u) => u.id !== userId);
          if (isTyping) {
            return [...filtered, { id: userId, name: userName }];
          }
          return filtered;
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
    [chatId, myId, chatType, environment],
  );

  useSubscription<useTypingSubscriptionType>(subscriptionConfig);

  if (typingUsers.length === 0) return null;

  if (chatType === "PRIVATE") {
    return { text: "typing", showDots: true };
  }

  if (typingUsers.length === 1) {
    return { text: `${typingUsers[0].name} is typing`, showDots: true };
  }

  if (typingUsers.length === 2) {
    return { text: `${typingUsers[0].name} and ${typingUsers[1].name} are typing`, showDots: true };
  }

  return { text: "several people are typing", showDots: true };
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
