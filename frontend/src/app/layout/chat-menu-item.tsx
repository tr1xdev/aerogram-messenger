import { Link } from "@tanstack/react-router";
import { Check, CheckCheck } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { LastMessageContent } from "./last-message-content";
import type { Chat, ChatMember, Message } from "@/entities/chat/model/types";

interface ChatMenuItemProps {
  chat: Chat;
  isActive: boolean;
  myId?: string;
}

export function ChatMenuItem({ chat, isActive, myId }: ChatMenuItemProps) {
  const lastMsg: Message | undefined = chat.lastMessage;
  const isMe: boolean = lastMsg?.sender.id === myId;
  const otherMember: ChatMember | undefined = chat.members?.find(
    (m) => m.user.id !== myId,
  );

  const isRead: boolean =
    isMe &&
    lastMsg?.sequence !== undefined &&
    chat.lastReadSequence !== undefined &&
    chat.lastReadSequence >= lastMsg.sequence;

  // Безопасное вычисление времени: если нет сообщения и createdAt в схеме, используем текущее время
  const displayTime = lastMsg ? new Date(lastMsg.sentAt) : new Date();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          "h-auto py-3 px-4 rounded-none border-l-2 border-transparent transition-all duration-200",
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
              <span className="text-[11px] text-muted-foreground font-medium ml-2 shrink-0">
                {displayTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div
                className={cn(
                  "text-[13px] truncate flex items-center gap-1 min-h-[1.25rem]",
                  chat.unreadCount > 0
                    ? "text-foreground font-medium"
                    : "text-muted-foreground",
                )}
              >
                {lastMsg ? (
                  <>
                    <span className="opacity-70 shrink-0 text-xs">
                      {isMe
                        ? "You: "
                        : `${lastMsg.sender.first_name || "User"}: `}
                    </span>
                    {myId ? (
                      <LastMessageContent
                        key={lastMsg.id}
                        message={lastMsg}
                        myId={myId}
                        chat={chat}
                      />
                    ) : (
                      <span className="truncate">{lastMsg.text}</span>
                    )}
                  </>
                ) : (
                  <span className="italic opacity-50 text-xs">
                    No messages yet
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isMe && lastMsg && (
                  <div className="mr-0.5 animate-in fade-in duration-300">
                    {isRead ? (
                      <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
                    ) : (
                      <Check className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </div>
                )}
                {!isMe && chat.unreadCount > 0 && (
                  <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
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
