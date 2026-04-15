import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { graphql, useSubscription, useMutation } from "react-relay";
import type { RecordSourceSelectorProxy, RecordProxy } from "relay-runtime";
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

interface TypingData {
  userId: string;
  isTyping: boolean;
}

export function useTypingSubscription(chatId: string): TypingData | null {
  const [typingData, setTypingData] = useState<TypingData | null>(null);

  const subscriptionConfig = useMemo(
    () => ({
      subscription: typingSubscription,
      variables: { chatID: chatId } as useTypingSubscription$variables,
      onNext: (
        response: useTypingSubscription$data | null | undefined,
      ): void => {
        if (response?.userTyping) {
          setTypingData({
            userId: String(response.userTyping.userId),
            isTyping: Boolean(response.userTyping.isTyping),
          });
        }
      },
      updater: (
        store: RecordSourceSelectorProxy<useTypingSubscription$data>,
      ): void => {
        const payload: RecordProxy | null | undefined =
          store.getRootField("userTyping");
        if (!payload) return;

        const userId: string = String(payload.getValue("userId"));
        const isTyping: boolean = Boolean(payload.getValue("isTyping"));

        const userRecord: RecordProxy | null | undefined = store.get(userId);
        if (userRecord) {
          userRecord.setValue(isTyping, "isTyping");
        }
      },
    }),
    [chatId],
  );

  useSubscription<useTypingSubscriptionType>(subscriptionConfig);

  return typingData;
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
