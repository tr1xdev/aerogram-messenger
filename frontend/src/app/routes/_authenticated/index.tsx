import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMyChats, useMe } from "@/features/chat/lib";
import { ChatMenuItem } from "@/features/chat/ui/chat-menu-item";
import type { Chat } from "@/entities/chat/model/types";

export const Route = createFileRoute("/_authenticated/")({
  component: IndexComponent,
});

function IndexComponent(): React.ReactNode {
  const chatsData = useMyChats();
  const userData = useMe();

  const chats: readonly Chat[] = useMemo((): readonly Chat[] => {
    if (chatsData?.myChats?.__typename === "ChatList") {
      return chatsData.myChats.chats as unknown as readonly Chat[];
    }
    return [];
  }, [chatsData]);

  return (
    <div className="h-full w-full">
      <div className="flex flex-col h-full md:hidden">
        <header className="px-6 pt-10 pb-4">
          <h1 className="text-2xl font-bold tracking-tight">Chats</h1>
        </header>
        <div className="flex-1 overflow-y-auto px-2 pb-20">
          {chats.map((chat: Chat) => (
            <ChatMenuItem
              key={chat.id}
              chat={chat}
              isActive={false}
              myId={userData?.me?.id}
            />
          ))}
        </div>
      </div>

      <div className="hidden md:flex h-full flex-col items-center justify-center bg-muted/10 text-muted-foreground">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium">Select a chat to start messaging</p>
      </div>
    </div>
  );
}
