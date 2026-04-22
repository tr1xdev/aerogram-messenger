import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useFragment, graphql } from "react-relay";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { UserAvatar } from "@/components/user-avatar";
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
import { useChatActions, useMessageActions } from "@/features/chat/lib";
import { DeleteChatDialog } from "./delete-chat-dialog";
import type {
  chatMenuItem_chat$key,
  chatMenuItem_chat$data,
} from "./__generated__/chatMenuItem_chat.graphql";

interface ChatMenuItemProps {
  chat: chatMenuItem_chat$key;
  isActive: boolean;
  myId?: string;
}

export function ChatMenuItem(props: ChatMenuItemProps): ReactNode {
  const chat: chatMenuItem_chat$data = useFragment(
    graphql`
      fragment chatMenuItem_chat on Chat {
        id
        title
        type
        photoUrl
        unreadCount
        isPinned
        lastReadSequence
        lastMessage {
          id
          text
          sentAt
          sequence
          sender {
            id
            firstName
            lastName
            username
            displayName
          }
        }
        members {
          user {
            id
            firstName
            lastName
            username
            photoUrl
            isVerified
            status
          }
        }
      }
    `,
    props.chat,
  );

  const { isActive, myId } = props;
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const { togglePin, deleteChat } = useChatActions(chat.id);
  const { markAsRead } = useMessageActions(chat.id);

  const otherMember = useMemo(
    (): NonNullable<chatMenuItem_chat$data["members"]>[number] | undefined =>
      chat.members?.find(
        (m: NonNullable<chatMenuItem_chat$data["members"]>[number]): boolean =>
          m.user?.id !== undefined && m.user.id !== myId,
      ),
    [chat.members, myId],
  );

  const otherUser = otherMember?.user;
  const chatTitle: string = chat.title || "";

  const displayName: string = useMemo((): string => {
    if (chat.type === "PRIVATE" && otherUser) {
      const first: string = otherUser.firstName?.trim() || "";
      const last: string = otherUser.lastName?.trim() || "";
      const full: string = `${first} ${last}`.trim();
      return full || otherUser.username || chatTitle || "Chat";
    }
    return chatTitle || "Chat";
  }, [chat.type, otherUser, chatTitle]);

  const avatarUrl: string | undefined = useMemo((): string | undefined => {
    if (chat.type === "PRIVATE") {
      return otherUser?.photoUrl || undefined;
    }
    return chat.photoUrl || undefined;
  }, [chat.type, chat.photoUrl, otherUser]);

  const lastMessage = chat.lastMessage;
  const isMe: boolean = lastMessage?.sender?.id === myId;
  const sender = lastMessage?.sender;
  const isOnline: boolean = otherUser?.status === "online";

  const showSenderName: boolean =
    chat.type !== "CHANNEL" && (chat.type === "GROUP" || isMe);

  const senderName: string | null = useMemo((): string | null => {
    if (!showSenderName || !sender) return null;
    if (isMe) return "You";
    const first: string = sender.firstName?.trim() || "";
    const last: string = sender.lastName?.trim() || "";
    const full: string = `${first} ${last}`.trim();
    return full || sender.username || null;
  }, [showSenderName, sender, isMe]);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              className="h-20.5 p-3 transition-all duration-200 hover:bg-muted/50 data-[active=true]:bg-primary/5 data-[state=open]:bg-muted/50"
            >
              <Link
                to="/chat/$chatId"
                params={{ chatId: chat.id }}
                className="flex items-center gap-3 w-full h-full"
              >
                <div className="relative shrink-0 self-center h-14 w-14">
                  <UserAvatar
                    src={avatarUrl}
                    fallback={displayName}
                    size={56}
                    className="border border-border/40"
                  />
                  {chat.type === "PRIVATE" && isOnline && (
                    <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500 z-10" />
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                  <div className="flex justify-between items-baseline min-h-5">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[15px] font-medium truncate text-foreground/90">
                        {displayName}
                      </span>
                      {chat.type === "PRIVATE" && otherUser?.isVerified && (
                        <MdVerified className="text-[#2196f3] shrink-0 text-[14px]" />
                      )}
                    </div>

                    {lastMessage && (
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <MessageStatus
                          isMe={isMe}
                          sequence={lastMessage.sequence ?? 0}
                          lastReadSequence={chat.lastReadSequence}
                          isSending={false}
                        />
                        <span className="text-xs font-medium text-muted-foreground/70 leading-none">
                          {new Date(lastMessage.sentAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {senderName && (
                    <div className="text-[15px] font-medium text-foreground/80 truncate leading-tight min-h-5 flex items-center">
                      {senderName}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2 min-h-4.5">
                    <div className="text-[13.5px] font-normal text-muted-foreground/70 min-w-0 leading-tight">
                      {lastMessage ? (
                        <LastMessageContent
                          message={
                            lastMessage as NonNullable<
                              chatMenuItem_chat$data["lastMessage"]
                            >
                          }
                          myId={myId ?? ""}
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
                      {chat.unreadCount !== null && chat.unreadCount > 0 && (
                        <Badge className="h-5 min-w-5 px-1 justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold border-none shadow-sm leading-none">
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

          {chat.unreadCount !== null &&
            chat.unreadCount > 0 &&
            lastMessage?.sequence !== undefined && (
              <ContextMenuItem
                onClick={(): void => {
                  markAsRead();
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
