import { useSubscription, useMutation } from "@apollo/client/react/index.js";
import { useMemo, useCallback } from "react";
import { USER_TYPING_SUBSCRIPTION, SEND_TYPING_EVENT } from "../../api";
import type { User } from "@/entities/chat/model/types";

interface TypingPayload {
  userId: string;
  isTyping: boolean;
}

export function useTypingSubscription(
  chatId: string,
): (User & { isTyping: boolean }) | undefined {
  const { data } = useSubscription<{ userTyping: TypingPayload }>(
    USER_TYPING_SUBSCRIPTION,
    {
      variables: { chatID: chatId },
      skip: !chatId,
    },
  );

  return useMemo((): (User & { isTyping: boolean }) | undefined => {
    if (!data?.userTyping) return undefined;
    return {
      id: data.userTyping.userId,
      isTyping: data.userTyping.isTyping,
    } as User & { isTyping: boolean };
  }, [data]);
}

export function useSendTyping(chatId: string): {
  sendTyping: (isTyping: boolean) => Promise<void>;
} {
  const [typing] = useMutation<
    { sendTypingEvent: boolean },
    { chatID: string; typing: boolean }
  >(SEND_TYPING_EVENT, { fetchPolicy: "no-cache" });

  const sendTyping = useCallback(
    async (isTyping: boolean): Promise<void> => {
      try {
        await typing({ variables: { chatID: chatId, typing: isTyping } });
      } catch (err) {
        console.error(err);
      }
    },
    [chatId, typing],
  );

  return { sendTyping };
}
