import { useMyChats, useMe } from "@/features/chat/lib/use-messages";
import { useGlobalSubscriptions } from "@/features/chat/lib/use-chat-subscription";

export function SubscriptionManager() {
  const { data: meData } = useMe();
  const { data: chatsData } = useMyChats();

  const myId = meData?.me.id;
  const chats = chatsData?.myChats ?? [];

  return (
    <>
      {chats.map((chat) => (
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
  useGlobalSubscriptions(chatId, myId);
  return null;
}
