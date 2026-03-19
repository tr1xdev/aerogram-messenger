import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MdVerified } from "react-icons/md";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { LastMessageContent } from "./last-message-content";
import { MessageStatus } from "./message-status";
import { BsFillPinFill } from "react-icons/bs";
import { Trash2, CheckCircle2, BellOff, PinOff } from "lucide-react";
import { useChatActions } from "../lib/use-messages";
import { DeleteChatDialog } from "./delete-chat-dialog";
import type {
  Chat,
  ChatMember,
  Message,
  User,
} from "@/entities/chat/model/types";

interface ChatMenuItemProps {
  chat: Chat;
  isActive: boolean;
  myId?: string;
}

export function ChatMenuItem({ chat, isActive, myId }: ChatMenuItemProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const { togglePin, markAsRead, deleteChat } = useChatActions(chat.id);

  const otherMember: ChatMember | undefined = useMemo(
    (): ChatMember | undefined =>
      chat.members?.find((m: ChatMember): boolean => m.user.id !== myId),
    [chat.members, myId],
  );

  const otherUser: User | undefined = otherMember?.user;
  const otherUserFirstName: string | undefined = otherUser?.firstName;
  const otherUserLastName: string | undefined = otherUser?.lastName;
  const otherUserUsername: string | undefined = otherUser?.username;
  const chatTitle: string | undefined = chat.title;

  const displayName: string = useMemo((): string => {
    if (otherUser) {
      const first: string = otherUserFirstName?.trim() || "";
      const last: string = otherUserLastName?.trim() || "";
      const full: string = `${first} ${last}`.trim();
      return full || otherUserUsername || "Chat";
    }
    return chatTitle || "Chat";
  }, [
    otherUser,
    otherUserFirstName,
    otherUserLastName,
    otherUserUsername,
    chatTitle,
  ]);

  const avatarUrl: string | undefined = useMemo((): string | undefined => {
    if (chat.type === "PRIVATE") {
      return otherUser?.photoUrl || undefined;
    }
    return chat.photoUrl || undefined;
  }, [chat.type, chat.photoUrl, otherUser?.photoUrl]);

  const initial: string = useMemo(
    (): string => (displayName.length > 0 ? displayName[0].toUpperCase() : "?"),
    [displayName],
  );

  const lastMessage: Message | undefined = chat.lastMessage ?? undefined;
  const isMe: boolean = lastMessage?.sender.id === myId;
  const sender: User | undefined = lastMessage?.sender;
  const isOnline: boolean = otherUser?.status === "online";

  const showSenderName: boolean =
    chat.type === "GROUP" || chat.type === "CHANNEL" || isMe;

  const senderFirstName: string | undefined = sender?.firstName;
  const senderLastName: string | undefined = sender?.lastName;
  const senderUsername: string | undefined = sender?.username;

  const senderName: string | null = useMemo((): string | null => {
    if (!showSenderName || !sender) return null;
    if (isMe) return "You";
    const first: string = senderFirstName?.trim() || "";
    const last: string = senderLastName?.trim() || "";
    const full: string = `${first} ${last}`.trim();
    return full || senderUsername || null;
  }, [
    showSenderName,
    sender,
    isMe,
    senderFirstName,
    senderLastName,
    senderUsername,
  ]);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              className="h-[82px] p-3 transition-all duration-200 hover:bg-muted/50 data-[active=true]:bg-primary/5 data-[state=open]:bg-muted/50"
            >
              <Link
                to="/chat/$chatId"
                params={{ chatId: chat.id }}
                className="flex items-center gap-3 w-full h-full"
              >
                <div className="relative shrink-0 self-center h-14 w-14">
                  <Avatar className="h-full w-full border border-border/40 rounded-full overflow-hidden aspect-square">
                    <AvatarImage
                      src={avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover aspect-square"
                    />
                    <AvatarFallback className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#54a4f5] to-[#2196f3] text-white/90 font-bold text-lg uppercase aspect-square">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500 z-10" />
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center h-full space-y-0">
                  <div className="flex justify-between items-baseline h-5">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[15px] font-bold truncate leading-none text-foreground/90">
                        {displayName}
                      </span>
                      {chat.type === "PRIVATE" && otherUser?.isVerified && (
                        <MdVerified className="text-[#2196f3] shrink-0 text-[14px]" />
                      )}
                    </div>

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
                        <span className="text-xs font-medium text-muted-foreground/60 leading-none">
                          {new Date(lastMessage.sentAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {senderName && (
                    <div className="text-[15px] font-semibold text-foreground/80 truncate leading-tight h-5 flex items-center">
                      {senderName}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2 h-5 mt-0.5">
                    <div className="text-[13.5px] font-normal text-muted-foreground/70 min-w-0 leading-tight truncate">
                      {lastMessage && myId ? (
                        <LastMessageContent
                          message={lastMessage}
                          myId={myId}
                          chat={chat}
                        />
                      ) : (
                        <span>No messages yet</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-center">
                      {chat.isPinned && chat.unreadCount === 0 && (
                        <BsFillPinFill className="h-3.5 w-3.5 text-muted-foreground/40" />
                      )}
                      {chat.unreadCount > 0 && (
                        <Badge className="h-5 min-w-5 px-1 justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold border-none shadow-sm">
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
            onClick={(): void => {
              togglePin(!chat.isPinned);
            }}
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
              onClick={(): void => {
                markAsRead(lastMessage.sequence!);
              }}
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
            onClick={(): void => {
              setIsDeleteOpen(true);
            }}
            className="gap-3 py-2.5 text-destructive focus:text-destructive cursor-pointer text-sm font-medium"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete chat</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <DeleteChatDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={(forEveryone: boolean): void => {
          deleteChat(forEveryone);
        }}
        displayName={displayName}
        isPrivate={chat.type === "PRIVATE"}
      />
    </>
  );
}
