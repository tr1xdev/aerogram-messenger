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

  const getUserInitial = (): string => {
    const name = userData?.me.first_name || userData?.me.username || "?";
    return name[0].toUpperCase();
  };

  return (
    <Sidebar collapsible="none" className="w-full border-none bg-background">
      <SidebarHeader className="px-4 pt-5 pb-2">
        <div className="flex items-center justify-between h-8 relative">
          <div className="flex-1" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center whitespace-nowrap">
            {!isWsConnected ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-[15px] font-medium text-foreground/70">
                  Connecting
                </span>
              </div>
            ) : (
              <h1 className="text-[17px] font-bold tracking-tight text-foreground">
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

      <SidebarContent className="scrollbar-none">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              {isLoading && !chatsData
                ? Array(12)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-10" />
                          </div>
                          <Skeleton className="h-3 w-full opacity-60" />
                        </div>
                      </div>
                    ))
                : chats.map((chat: Chat) => (
                    <ChatMenuItem
                      key={chat.id}
                      chat={chat}
                      isActive={pathname.includes(chat.id)}
                      myId={userData?.me.id}
                    />
                  ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="hidden md:flex p-4 border-t bg-muted/5">
        {!userData?.me ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-12" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border/50">
              <AvatarFallback className="font-bold text-xs bg-primary/10 text-primary">
                {getUserInitial()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate leading-none mb-1">
                {userData.me.first_name || userData.me.username || "User"}
              </span>
              <span className="text-[10px] text-primary font-bold uppercase tracking-widest">
                Active
              </span>
            </div>
          </div>
        )}
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
  const isMe = lastMsg?.sender.id === myId;
  const otherMember = chat.members?.find((m: ChatMember) => m.user.id !== myId);
  const isRead =
    isMe &&
    lastMsg?.sequence !== undefined &&
    chat.lastReadSequence >= lastMsg.sequence;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          "h-auto py-3 px-4 rounded-none border-l-2 border-transparent transition-colors",
          isActive ? "bg-primary/5 border-l-primary" : "hover:bg-muted/40",
        )}
      >
        <Link
          to="/chat/$chatId"
          params={{ chatId: chat.id }}
          className="flex items-center gap-3 w-full"
        >
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12 border-none shadow-sm">
              <AvatarFallback className="bg-muted text-foreground/60 font-bold text-lg">
                {chat.title.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {otherMember?.user.status === "online" && (
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-[3px] border-background shadow-sm z-10" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span
                className={cn(
                  "text-[15px] truncate",
                  chat.unreadCount > 0 ? "font-bold" : "font-semibold",
                )}
              >
                {chat.title}
              </span>
              {lastMsg && (
                <span className="text-[11px] text-muted-foreground font-medium ml-2">
                  {new Date(lastMsg.sentAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <p
                className={cn(
                  "text-[13px] truncate",
                  chat.unreadCount > 0
                    ? "text-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                {lastMsg ? (
                  <>
                    <span className="opacity-70">
                      {isMe
                        ? "You: "
                        : `${lastMsg.sender.first_name || "User"}: `}
                    </span>
                    {lastMsg.text}
                  </>
                ) : (
                  "No messages"
                )}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                {isMe && lastMsg && (
                  <div className="mr-0.5">
                    {isRead ? (
                      <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Check className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </div>
                )}
                {!isMe && chat.unreadCount > 0 && (
                  <span className="h-4.5 min-w-[18px] px-1 flex items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
