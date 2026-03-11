import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Link } from "@tanstack/react-router";
import { LastMessageContent } from "./last-message-content";
import { MessageStatus } from "./message-status";
import type { Chat } from "@/entities/chat/model/types";
import { BsFillPinFill } from "react-icons/bs";
import { Trash2, CheckCircle2, BellOff, PinOff } from "lucide-react";
import { useChatActions } from "../lib/use-messages";

interface ChatMenuItemProps {
  chat: Chat;
  isActive: boolean;
  myId?: string;
}

export function ChatMenuItem({ chat, isActive, myId }: ChatMenuItemProps) {
  const { togglePin, markAsRead, deleteChat } = useChatActions(chat.id);

  const otherMember = chat.members?.find((m) => m.user.id !== myId);
  const otherUser = otherMember?.user;
  const displayName = otherUser
    ? [otherUser.first_name, otherUser.last_name].filter(Boolean).join(" ") ||
      otherUser.username ||
      "Chat"
    : chat.title || "Chat";

  const initial =
    displayName && displayName.length > 0 ? displayName[0].toUpperCase() : "?";
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

  const handleDelete = async (): Promise<void> => {
    const confirmed = window.confirm(`Delete chat with ${displayName}?`);
    if (confirmed) {
      await deleteChat();
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
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
                  <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background z-10 bg-green-500" />
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
                        isRead={
                          (lastMessage.sequence ?? 0) <=
                          (chat.lastReadSequence || 0)
                        }
                        isMe={isMe}
                        sequence={lastMessage.sequence ?? 0}
                        lastReadSequence={chat.lastReadSequence}
                      />
                      <span className="text-xs font-medium text-muted-foreground/60">
                        {new Date(lastMessage.sentAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {senderName && (
                  <div className="text-[13px] font-medium text-foreground/90 truncate leading-tight mt-0.5">
                    {senderName}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <div className="text-[13.5px] font-normal text-muted-foreground/80 truncate leading-tight min-w-0">
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

                  <div className="flex items-center gap-2 shrink-0">
                    {chat.isPinned && (
                      <BsFillPinFill className="h-3.5 w-3.5 text-muted-foreground/50" />
                    )}

                    {chat.unreadCount > 0 && (
                      <Badge className="h-5 min-w-[20px] px-1 justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold border-none shrink-0 shadow-sm">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56 rounded-xl shadow-xl">
        <ContextMenuItem
          onClick={() => togglePin(!chat.isPinned)}
          className="gap-3 py-2.5 cursor-pointer text-sm font-medium"
        >
          {chat.isPinned ? (
            <>
              <PinOff className="h-4 w-4 text-muted-foreground/70" />
              <span>Unpin chat</span>
            </>
          ) : (
            <>
              <BsFillPinFill className="h-4 w-4 text-muted-foreground/70" />
              <span>Pin to top</span>
            </>
          )}
        </ContextMenuItem>

        {chat.unreadCount > 0 && lastMessage?.sequence !== undefined && (
          <ContextMenuItem
            onClick={() => markAsRead(lastMessage.sequence!)}
            className="gap-3 py-2.5 cursor-pointer text-sm font-medium"
          >
            <CheckCircle2 className="h-4 w-4 text-muted-foreground/70" />
            <span>Mark as read</span>
          </ContextMenuItem>
        )}

        <ContextMenuItem className="gap-3 py-2.5 cursor-pointer text-sm font-medium">
          <BellOff className="h-4 w-4 text-muted-foreground/70" />
          <span>Mute</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={handleDelete}
          className="gap-3 py-2.5 text-destructive focus:text-destructive cursor-pointer text-sm font-medium"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete chat</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
