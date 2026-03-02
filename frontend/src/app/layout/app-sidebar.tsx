import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { NewChatDialog } from "@/features/chat/ui/new-chat-dialog";
import { useMyChats, useMe } from "@/features/chat/lib/use-messages";
import { useGlobalSubscriptions } from "@/features/chat/lib/use-global-subscription";
import type { Chat } from "@/entities/chat/model/types";

export function AppSidebar() {
  const { data: userData } = useMe();
  const { data: chatsData, loading: isLoading } = useMyChats();
  const { setOpenMobile } = useSidebar();
  const pathname = useRouterState().location.pathname;

  const chats = chatsData?.myChats ?? [];
  const totalUnread = chats.reduce(
    (acc, chat) => acc + (chat.unreadCount ?? 0),
    0,
  );

  return (
    <Sidebar collapsible="offcanvas" className="border-r">
      <SidebarHeader className="flex flex-col px-3 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">
            Messages {totalUnread > 0 && `(${totalUnread})`}
          </span>
          <NewChatDialog />
        </div>
        <div className="mt-3 h-px w-full bg-border" />
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2 py-2">
              {isLoading ? (
                Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <SidebarMenuItem key={i}>
                      <div className="flex items-center gap-3 rounded-md px-2 py-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </SidebarMenuItem>
                  ))
              ) : chats.length === 0 ? (
                <SidebarMenuItem>
                  <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                    No chats yet
                  </div>
                </SidebarMenuItem>
              ) : (
                chats.map((chat: Chat) => (
                  <ChatMenuItem
                    key={chat.id}
                    chat={chat}
                    currentPath={pathname}
                    myId={userData?.me.id}
                    onSelect={() => setOpenMobile(false)}
                  />
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-3 border-t">
        <div className="text-xs text-muted-foreground truncate">
          {userData?.me.first_name ?? userData?.me.username ?? "Loading..."}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function ChatMenuItem({
  chat,
  currentPath,
  myId,
  onSelect,
}: {
  chat: Chat;
  currentPath: string;
  myId?: string;
  onSelect: () => void;
}) {
  useGlobalSubscriptions(chat.id, myId);

  const isMe = chat.lastMessage?.sender.id === myId;
  const senderName = isMe ? "You" : chat.lastMessage?.sender.first_name;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={currentPath === `/chat/${chat.id}`}
        className="h-auto p-0"
        onClick={onSelect}
      >
        <Link
          to="/chat/$chatId"
          params={{ chatId: chat.id }}
          className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-muted transition"
        >
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {chat.title.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="truncate text-sm font-medium">{chat.title}</span>
              {chat.lastMessage && (
                <span className="ml-2 shrink-0 text-[11px] text-muted-foreground">
                  {new Date(chat.lastMessage.sentAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="truncate text-xs text-muted-foreground">
                {chat.lastMessage
                  ? `${senderName}: ${chat.lastMessage.text}`
                  : "No messages yet"}
              </p>
              {chat.unreadCount > 0 && (
                <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                  {chat.unreadCount}
                </span>
              )}
            </div>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
