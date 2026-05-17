import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useFragment, graphql, useMutation } from "react-relay";
import type { RecordSourceSelectorProxy, RecordProxy } from "relay-runtime";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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
import { Trash2, CheckCircle2, BellOff, PinOff, LogOut } from "lucide-react";
import { useChatActions, useMessageActions } from "@/features/chat/lib";
import { DeleteChatDialog } from "./delete-chat-dialog";

import type {
  chatMenuItem_chat$key,
  chatMenuItem_chat$data,
} from "./__generated__/chatMenuItem_chat.graphql";

const PinChatMutation = graphql`
  mutation chatMenuItemPinChatMutation($id: ID!, $pinned: Boolean!) {
    pinChat(id: $id, pinned: $pinned) {
      ... on SuccessResult {
        success
      }
    }
  }
`;

const LeaveChatMutation = graphql`
  mutation chatMenuItemLeaveChatMutation($id: ID!) {
    leaveChat(chatID: $id) {
      ... on SuccessResult {
        success
      }
    }
  }
`;

interface ChatMenuItemProps {
  chat: chatMenuItem_chat$key;
  isActive: boolean;
  myId?: string;
}

type ChatMember = NonNullable<chatMenuItem_chat$data["members"]>[number];
type ChatMessage = NonNullable<chatMenuItem_chat$data["lastMessage"]>;

export function ChatMenuItem({
  chat: chatKey,
  isActive,
  myId,
}: ChatMenuItemProps): ReactNode {
  const navigate = useNavigate();
  const chat: chatMenuItem_chat$data = useFragment(
    graphql`
      fragment chatMenuItem_chat on Chat {
        id
        title
        type
        photoUrl
        unreadCount
        isPinned
        myRole
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
    chatKey,
  );

  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [commitPin] = useMutation(PinChatMutation);
  const [commitLeave] = useMutation(LeaveChatMutation);

  const chatId: string = chat.id;
  const { deleteChat } = useChatActions(chatId);
  const { markAsRead } = useMessageActions(chatId);

  const otherMember = useMemo((): ChatMember | undefined => {
    if (!chat.members || chat.type !== "PRIVATE") return undefined;
    return chat.members.find((m: ChatMember): boolean => m.user?.id !== myId);
  }, [chat.members, chat.type, myId]);

  const otherUser = otherMember?.user;
  const isPrivate: boolean = chat.type === "PRIVATE";

  const displayName: string = useMemo((): string => {
    if (isPrivate && otherUser) {
      const full: string =
        `${otherUser.firstName ?? ""} ${otherUser.lastName ?? ""}`.trim();
      return full || otherUser.username || chat.title || "Chat";
    }
    return chat.title || "Chat";
  }, [chat.title, isPrivate, otherUser]);

  const avatarUrl: string | undefined = isPrivate
    ? (otherUser?.photoUrl ?? undefined)
    : (chat.photoUrl ?? undefined);

  const lastMessage = chat.lastMessage;
  const isMe: boolean = lastMessage?.sender?.id === myId;
  const isOnline: boolean = otherUser?.status === "online";

  const senderName: string | null = useMemo((): string | null => {
    if (!lastMessage?.sender || chat.type === "CHANNEL") return null;
    if (isMe) return "You";
    const s = lastMessage.sender;
    return (
      `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || s.username || null
    );
  }, [lastMessage, chat.type, isMe]);

  const handleTogglePin = (pinned: boolean): void => {
    handleTogglePinInternal(pinned);
  };

  const handleTogglePinInternal = (pinned: boolean): void => {
    const updatePin = (store: RecordSourceSelectorProxy): void => {
      const record: RecordProxy | null | undefined = store.get(chatId);
      if (record) {
        record.setValue(pinned, "isPinned");
      }
    };

    commitPin({
      variables: { id: chatId, pinned },
      optimisticUpdater: updatePin,
      updater: updatePin,
    });
  };

  const handleLeave = async (): Promise<void> => {
    if (isActive) {
      await navigate({ to: "/", replace: true });
    }

    const updateLeave = (store: RecordSourceSelectorProxy): void => {
      const root: RecordProxy = store.getRoot();
      const myChats: RecordProxy | null | undefined =
        root.getLinkedRecord("myChats");
      if (myChats) {
        const chats: readonly (RecordProxy | null)[] =
          myChats.getLinkedRecords("chats") ?? [];
        myChats.setLinkedRecords(
          chats.filter(
            (c: RecordProxy | null): boolean => c?.getDataID() !== chatId,
          ),
          "chats",
        );
      }
      store.delete(chatId);
    };

    commitLeave({
      variables: { id: chatId },
      optimisticUpdater: updateLeave,
      updater: updateLeave,
      onCompleted: (): void => {
        toast.success("Left chat");
      },
    });
  };

  const handleConfirmDelete = async (everyone: boolean): Promise<void> => {
    if (isActive) {
      await navigate({ to: "/", replace: true });
    }
    deleteChat(everyone);
  };

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className="h-20.5 p-3 transition-colors data-[active=true]:bg-primary/10"
              >
                <Link
                  to="/chat/$chatId"
                  params={{ chatId }}
                  className="flex items-center gap-3 w-full"
                >
                  <div className="relative shrink-0 h-14 w-14">
                    <UserAvatar
                      src={avatarUrl}
                      fallback={displayName}
                      size={56}
                    />
                    {isPrivate && isOnline && (
                      <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500 z-10" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-baseline">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-[15px] font-semibold truncate text-foreground/90">
                          {displayName}
                        </span>
                        {isPrivate && otherUser?.isVerified && (
                          <MdVerified className="text-blue-500 shrink-0 text-sm" />
                        )}
                      </div>
                      {lastMessage && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <MessageStatus
                            isMe={isMe}
                            chatType={
                              chat.type as "PRIVATE" | "GROUP" | "CHANNEL"
                            }
                            sequence={lastMessage.sequence ?? 0}
                            lastReadSequence={chat.lastReadSequence}
                            isSending={false}
                          />
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {new Date(lastMessage.sentAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {senderName && (
                      <span className="text-[13px] font-medium text-primary/80 truncate">
                        {senderName}
                      </span>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[13px] font-normal text-muted-foreground min-w-0 flex-1 opacity-85">
                        {lastMessage ? (
                          <LastMessageContent
                            message={lastMessage as ChatMessage}
                            myId={myId ?? ""}
                            chat={chat}
                          />
                        ) : (
                          "No messages yet"
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {chat.isPinned && (chat.unreadCount ?? 0) === 0 && (
                          <BsFillPinFill className="h-3.5 w-3.5 text-muted-foreground/40" />
                        )}
                        {(chat.unreadCount ?? 0) > 0 && (
                          <Badge className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-[10px] font-bold border-none">
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

          <ContextMenuContent className="w-56 rounded-xl">
            <ContextMenuItem
              onClick={(): void => handleTogglePin(!chat.isPinned)}
              className="gap-2"
            >
              {chat.isPinned ? (
                <PinOff className="h-4 w-4" />
              ) : (
                <BsFillPinFill className="h-4 w-4" />
              )}
              <span>{chat.isPinned ? "Unpin chat" : "Pin to top"}</span>
            </ContextMenuItem>

            {(chat.unreadCount ?? 0) > 0 && (
              <ContextMenuItem
                onClick={(): void => markAsRead()}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Mark as read</span>
              </ContextMenuItem>
            )}

            <ContextMenuItem disabled className="gap-2 opacity-50">
              <BellOff className="h-4 w-4" />
              <span>Mute</span>
            </ContextMenuItem>

            <ContextMenuSeparator />

            {!isPrivate && (
              <ContextMenuItem
                onClick={(): Promise<void> => handleLeave()}
                className="gap-2 text-destructive"
              >
                <LogOut className="h-4 w-4" />
                <span>Leave chat</span>
              </ContextMenuItem>
            )}

            <ContextMenuItem
              onClick={(): void => setIsDeleteOpen(true)}
              className="gap-2 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete chat</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        <DeleteChatDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          onConfirm={handleConfirmDelete}
          displayName={displayName}
          isPrivate={isPrivate}
        />
      </motion.div>
    </AnimatePresence>
  );
}
