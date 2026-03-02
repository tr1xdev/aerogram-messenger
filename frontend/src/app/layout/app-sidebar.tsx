import { Link, useRouterState } from "@tanstack/react-router";
import { Check, CheckCheck, Loader2 } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { NewChatDialog } from "@/features/chat/ui/new-chat-dialog";
import { useMyChats, useMe } from "@/features/chat/lib/use-messages";
import { useConnectionStore } from "@/store/connection";
import type { Chat, ChatMember } from "@/entities/chat/model/types";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { data: userData } = useMe();
  const { data: chatsData, loading: isLoading } = useMyChats();
  const pathname = useRouterState().location.pathname;
  const isWsConnected = useConnectionStore((state) => state.isWsConnected);

  const chats = chatsData?.myChats ?? [];

  return (
    <Sidebar collapsible="none" className="w-full border-none bg-background">
      <SidebarHeader className="px-4 pt-5 pb-2">
        <div className="flex items-center justify-between h-8 relative">
          <div className="flex-1" />

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            {!isWsConnected ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                <span className="text-[17px] tracking-tight text-foreground">
                  Connecting...
                </span>
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                <span className="text-[17px] tracking-tight text-foreground">
                  Updating...
                </span>
              </div>
            ) : (
              <h1 className="text-[17px] tracking-tight text-foreground">
                Chats
              </h1>
            )}
          </div>

          <div className="flex-1 flex justify-end z-10">
            <NewChatDialog />
          </div>
        </div>
        <div className="mt-4 h-px w-full bg-border/40" />
      </SidebarHeader>

      <SidebarContent className="scrollbar-none pb-20 md:pb-0">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              {isLoading && !chatsData
                ? Array(8)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-4"
                      >
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))
                : chats.map((chat: Chat) => (
                    <ChatMenuItem
                      key={chat.id}
                      chat={chat}
                      isActive={pathname === `/chat/${chat.id}`}
                      myId={userData?.me.id}
                    />
                  ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="hidden md:flex p-4 border-t bg-muted/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-9 w-9 border">
              <AvatarFallback className="bg-primary/5 text-xs text-primary">
                {(
                  userData?.me.first_name?.[0] ??
                  userData?.me.username?.[0] ??
                  "?"
                ).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-sky-500 border-[2.5px] border-background" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm truncate leading-none mb-1 text-foreground">
              {userData?.me.first_name ?? userData?.me.username ?? "User"}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
              Active Now
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function ChatMenuItem({
  chat,
  isActive,
  myId,
}: {
  chat: Chat;
  isActive: boolean;
  myId?: string;
}) {
  const lastMsg = chat.lastMessage;
  const isLastMsgFromMe = lastMsg?.sender.id === myId;
  const senderName = isLastMsgFromMe ? "You" : lastMsg?.sender.first_name;

  const otherMember = chat.members?.find((m: ChatMember) => m.user.id !== myId);
  const isOnline = otherMember?.user.status === "online";

  const isRead =
    isLastMsgFromMe &&
    typeof lastMsg?.sequence === "number" &&
    chat.lastReadSequence >= lastMsg.sequence;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          "h-auto py-3 px-4 rounded-none transition-none border-l-2 border-transparent relative",
          isActive ? "bg-primary/5 border-l-primary" : "hover:bg-muted/50",
        )}
      >
        <Link
          to="/chat/$chatId"
          params={{ chatId: chat.id }}
          className="flex items-center gap-3"
        >
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-muted text-sm">
                {chat.title.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <div
                className={cn(
                  "absolute bottom-0 right-0 h-4 w-4 rounded-full bg-sky-500 border-[3px]",
                  isActive
                    ? "border-[#f4f4f5] dark:border-[#131315]"
                    : "border-background",
                )}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[15px] truncate text-foreground">
                {chat.title}
              </span>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {isLastMsgFromMe && lastMsg && (
                  <div className="flex items-center">
                    {isRead ? (
                      <CheckCheck className="h-4 w-4 text-sky-500" />
                    ) : (
                      <Check className="h-4 w-4 text-muted-foreground/60" />
                    )}
                  </div>
                )}
                {lastMsg && (
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {new Date(lastMsg.sentAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] text-muted-foreground truncate">
                {lastMsg ? (
                  <>
                    <span className="text-foreground/60">{senderName}:</span>{" "}
                    {lastMsg.text}
                  </>
                ) : (
                  "No messages"
                )}
              </p>
              {chat.unreadCount > 0 && (
                <span className="shrink-0 flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
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
