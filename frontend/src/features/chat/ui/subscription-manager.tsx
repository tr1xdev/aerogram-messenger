import {
  useMyChats,
  useMe,
  useAppTitle,
  useGlobalSubscriptions,
} from "@/features/chat/lib";
import { useEffect, type ReactNode } from "react";
import type { Chat } from "@/entities/chat/model/types";
import type { useMeQuery$data } from "@/features/chat/lib/common/__generated__/useMeQuery.graphql";
import type { useAppTitle_chats$key } from "@/features/chat/lib/common/__generated__/useAppTitle_chats.graphql";

const logStyle = (color: string): string =>
  `color: ${color}; font-weight: bold; font-family: "JetBrains Mono", monospace;`;
const dimStyle: string = `color: #888; font-family: "JetBrains Mono", monospace;`;

export function SubscriptionManager(): ReactNode {
  const meData: useMeQuery$data = useMe();
  const chatsData = useMyChats();

  const myId: string | undefined = meData?.me?.id;

  const chatsKey =
    chatsData?.myChats as unknown as useAppTitle_chats$key | null;

  useAppTitle(chatsKey);

  const chats: readonly Chat[] =
    chatsData?.myChats?.__typename === "ChatList"
      ? (chatsData.myChats.chats as unknown as readonly Chat[])
      : [];

  useEffect((): void => {
    if (chats.length > 0) {
      console.log(
        "%c[WS]%c initializing subscriptions for %c%d%c chats",
        logStyle("#00d4ff"),
        dimStyle,
        "color: #fff; font-weight: bold;",
        chats.length,
        dimStyle,
      );
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
    console.log(
      "%c[SUB]%c active for chat:%c %s",
      logStyle("#a855f7"),
      dimStyle,
      "color: #e9d5ff;",
      chatId,
    );
  }, [chatId]);

  useGlobalSubscriptions(chatId, myId);
  return null;
}
