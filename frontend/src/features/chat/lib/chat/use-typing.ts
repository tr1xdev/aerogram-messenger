import { useCallback, useMemo, useState } from "react";
import { graphql, useSubscription, useMutation } from "react-relay";
import type {
  RecordSourceSelectorProxy,
  ReadOnlyRecordProxy,
} from "relay-runtime";
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
        const payload: ReadOnlyRecordProxy | null =
          store.getRootField("userTyping");
        if (!payload) return;

        const userId: string = String(payload.getValue("userId"));
        const isTyping: boolean = Boolean(payload.getValue("isTyping"));

        const userRecord = store.get(userId);
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
  sendTyping: (isTyping: boolean) => void;
} {
  const [commit] = useMutation<useTypingSendMutation>(sendTypingMutation);

  const sendTyping = useCallback(
    (isTyping: boolean): void => {
      commit({
        variables: {
          chatID: chatId,
          typing: isTyping,
        },
      });
    },
    [chatId, commit],
  );

  return { sendTyping };
}
