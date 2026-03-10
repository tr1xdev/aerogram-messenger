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
  const otherUser = otherMember?.user;
  const displayName = otherUser
    ? [otherUser.first_name, otherUser.last_name].filter(Boolean).join(" ") ||
      otherUser.username ||
      "Chat"
    : "Chat";
  const initial = displayName[0].toUpperCase();
  const isOnline = otherMember?.user.status === "online";

  const lastMessage = chat.lastMessage;
  const isMe = lastMessage?.sender.id === myId;
  const sender = lastMessage?.sender;

  const isGroup = (chat.members?.length ?? 0) > 2;
  const showSenderName = isGroup || isMe;
  const senderName =
    showSenderName && sender
      ? isMe
        ? "You"
        : [sender.first_name, sender.last_name].filter(Boolean).join(" ") ||
          sender.username
      : null;

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
            <Avatar className="h-14 w-14 border border-border/40 overflow-visible">
              <AvatarFallback className="bg-primary/5 text-primary font-bold text-lg">
                {initial}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <span
                className={cn(
                  "absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background z-10 transition-colors bg-green-500",
                )}
              />
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex justify-between items-baseline">
              <span className="text-[15px] font-bold truncate leading-tight">
                {displayName}
              </span>

              {lastMessage && (
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <MessageStatus
                    isRead={lastMessage.isRead}
                    isMe={isMe}
                    sequence={lastMessage.sequence}
                    lastReadSequence={chat.lastReadSequence}
                  />
                  <span className="text-xs font-medium text-muted-foreground">
                    {new Date(lastMessage.sentAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>

            {senderName && (
              <div className="text-sm font-normal text-foreground truncate leading-tight">
                {senderName}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-normal text-muted-foreground/80 truncate leading-tight min-w-0">
                {lastMessage && myId ? (
                  <LastMessageContent
                    message={lastMessage}
                    myId={myId}
                    chat={chat}
                  />
                ) : (
                  "No messages yet"
                )}
              </div>

              {chat.unreadCount > 0 && (
                <Badge className="h-5 min-w-[20px] px-1 justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold border-none shrink-0">
                  {chat.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
