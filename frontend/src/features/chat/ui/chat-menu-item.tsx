import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { LastMessageContent } from "./last-message-content";
import { MessageStatus } from "./message-status";
import type { Chat } from "@/entities/chat/model/types";
import { cn } from "@/lib/utils";

interface ChatMenuItemProps {
  chat: Chat;
  isActive: boolean;
  myId?: string;
}

export function ChatMenuItem({ chat, isActive, myId }: ChatMenuItemProps) {
  const otherMember = chat.members?.find((m) => m.user.id !== myId);
  const displayName =
    otherMember?.user.first_name || otherMember?.user.username || "Chat";
  const initial = displayName[0].toUpperCase();
  const isMe = chat.lastMessage?.sender.id === myId;
  const isOnline = otherMember?.user.status === "online";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="h-auto p-4 transition-all duration-200 hover:bg-muted/50 data-[active=true]:bg-primary/[0.04]"
      >
        <Link
          to="/chat/$chatId"
          params={{ chatId: chat.id }}
          className="flex items-center gap-3"
        >
          <div className="relative shrink-0">
            <Avatar className="h-12 w-12 border border-border/40 overflow-visible">
              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background z-10 transition-colors",
                isOnline ? "bg-green-500" : "bg-zinc-500",
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[15px] font-bold truncate leading-none">
                {displayName}
              </span>
              {chat.lastMessage && (
                <span className="text-[10px] text-muted-foreground font-medium uppercase shrink-0 ml-2">
                  {new Date(chat.lastMessage.sentAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[13px] text-muted-foreground/80 truncate font-medium flex items-center min-w-0">
                {isMe && (
                  <span className="mr-1 shrink-0 text-primary/70">You:</span>
                )}
                <div className="truncate">
                  {chat.lastMessage && myId ? (
                    <LastMessageContent
                      message={chat.lastMessage}
                      myId={myId}
                      chat={chat}
                    />
                  ) : (
                    "No messages yet"
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {chat.lastMessage && (
                  <MessageStatus isRead={chat.lastMessage.isRead} isMe={isMe} />
                )}
                {chat.unreadCount > 0 && (
                  <Badge className="h-5 min-w-[20px] px-1 justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold border-none">
                    {chat.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
