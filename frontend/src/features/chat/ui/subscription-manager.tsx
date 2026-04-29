import {
  useMyChats,
  useMe,
  useAppTitle,
  useGlobalSubscriptions,
} from "@/features/chat/lib";
import { useEffect, useMemo, type ReactNode } from "react";
import type { Chat } from "@/entities/chat/model/types";
import type { useMeQuery$data } from "@/features/chat/lib/common/__generated__/useMeQuery.graphql";
import type { useAppTitle_chats$key } from "@/features/chat/lib/common/__generated__/useAppTitle_chats.graphql";
import { logger } from "@/shared/lib/logger";

export function SubscriptionManager(): ReactNode {
  const meData: useMeQuery$data = useMe();
  const chatsData = useMyChats();

  const myId: string | undefined = meData?.me?.id;

  const chatsKey =
    chatsData?.myChats as unknown as useAppTitle_chats$key | null;

  useAppTitle(chatsKey);

  const chats: readonly Chat[] = useMemo((): readonly Chat[] => {
    const result = chatsData?.myChats;

    if (result?.__typename !== "ChatList") {
      return [];
    }

    const chatsList = result.chats;

    return (chatsList || []).filter(
      (c: unknown): c is Chat => c !== null && c !== undefined,
    ) as unknown as readonly Chat[];
  }, [chatsData?.myChats]);

  useEffect((): void => {
    if (chats.length > 0) {
      logger.ws(`Initializing subscriptions for ${chats.length} chats`);
    }
  }, [chats.length]);

  return (
    <>
      {chats.map(
        (chat: Chat): ReactNode => (
          <ActiveSubscription key={chat.id} chatId={chat.id} myId={myId} />
        ),
      )}
    </>
  );
}

function ActiveSubscription({
  chatId,
  myId,
}: {
  chatId: string;
  myId: string | undefined;
}): null {
  useEffect((): void => {
    logger.debug("WS", `Active subscription for chat: ${chatId}`);
  }, [chatId]);

  useGlobalSubscriptions(chatId, myId);
  return null;
}
