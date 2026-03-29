import { useMyChats, useMe } from "@/features/chat/lib";
import { useGlobalSubscriptions } from "@/features/chat/lib/use-global-subscription";
import { useEffect } from "react";
import type { Chat } from "@/entities/chat/model/types";

const logStyle = (color: string): string =>
  `color: ${color}; font-weight: bold; font-family: "JetBrains Mono", monospace;`;
const dimStyle = `color: #888; font-family: "JetBrains Mono", monospace;`;

export function SubscriptionManager() {
  const { data: meData } = useMe();
  const { data: chatsData, loading, error } = useMyChats();

  const myId: string | undefined = meData?.me.id;
  const chats: Chat[] = chatsData?.myChats?.chats || [];

  useEffect(() => {
    if (loading) return;

    if (error) {
      console.log(
        "%c[WS]%c subscription error:%c %s",
        logStyle("#ff4d4d"),
        dimStyle,
        "color: #fca5a5;",
        error.message,
      );
      return;
    }

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
  }, [chats.length, loading, error]);

  return (
    <>
      {chats.map((chat: Chat) => (
        <ActiveSubscription key={chat.id} chatId={chat.id} myId={myId} />
      ))}
    </>
  );
}

function ActiveSubscription({
  chatId,
  myId,
}: {
  chatId: string;
  myId?: string;
}) {
  useEffect(() => {
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
