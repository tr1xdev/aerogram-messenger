import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useChatStore } from "@/store/chat";
import {
  useChatHistory,
  useMe,
  useChatDetails,
  useMyChats,
  useMessageActions,
  useSendTyping,
  type MyChatsResponse,
  type ChatDetailsResponse,
} from "@/features/chat/lib";
import { useMarkDialog } from "@/features/chat/lib";
import { ChatHeader } from "@/features/chat/ui/chat-header";
import { MessageList } from "@/features/chat/ui/message-list";
import { MessageComposer } from "@/features/chat/ui/message-composer";
import { AlertCircle, ArrowLeft } from "lucide-react";
import type { Message, User } from "@/entities/chat/model/types";
import type { useMarkDialog_chat$key } from "@/features/chat/lib/chat/__generated__/useMarkDialog_chat.graphql";
import type { useMeQuery$data } from "@/features/chat/lib/common/__generated__/useMeQuery.graphql";
import type { chatHeader_user$key } from "@/features/chat/ui/__generated__/chatHeader_user.graphql";
import type { useChatsDetailsQuery$data } from "@/features/chat/lib/chat/__generated__/useChatsDetailsQuery.graphql";
import type { messageBubble_message$data } from "@/features/chat/ui/__generated__/messageBubble_message.graphql";
import type { messageList_metadata$key } from "@/features/chat/ui/__generated__/messageList_metadata.graphql";

type ChatNode = Extract<
  useChatsDetailsQuery$data["chat"],
  { readonly __typename: "Chat" }
>;

type RelayMember = NonNullable<ChatNode["members"]>[number];

interface ExtendedUser extends Omit<User, "lastName"> {
  lastName: string | null;
  displayName: string | null;
}

interface ChatStoreState {
  input: string;
  setInput: (val: string) => void;
  resetInput: () => void;
  setActiveChatId: (id: string | null) => void;
}

export const Route = createFileRoute("/_authenticated/chat/$chatId")({
  component: ChatRoute,
});

function ChatRoute(): ReactNode {
  const { chatId }: { chatId: string } = Route.useParams();
  return <ChatPage key={chatId} chatId={chatId} />;
}

export function ChatPage({ chatId }: { chatId: string }): ReactNode {
  const navigate = useNavigate();
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);
  const [isOptimisticJoined, setIsOptimisticJoined] = useState<boolean>(false);

  const { input, setInput, resetInput, setActiveChatId } =
    useChatStore() as ChatStoreState;
  const inputRef = useRef<string>(input);

  useEffect((): void => {
    inputRef.current = input;
  }, [input]);

  const meData: useMeQuery$data = useMe();
  const chatData: ChatDetailsResponse = useChatDetails(chatId);
  const chatsData: MyChatsResponse = useMyChats();

  const me: User | undefined = meData?.me
    ? (meData.me as unknown as User)
    : undefined;
  const chatRaw = chatData.chat;

  const chatNode = useMemo((): (ChatNode & { slug?: string }) | null => {
    if (chatRaw?.__typename === "Chat") {
      return chatRaw as unknown as ChatNode & { slug?: string };
    }
    return null;
  }, [chatRaw]);

  const isMember: boolean = useMemo((): boolean => {
    if (isOptimisticJoined) return true;
    if (!chatNode) return false;
    const role: string = (chatNode.myRole ?? "").toLowerCase();
    if (role && role !== "none") return true;

    if (chatNode.members && me) {
      return chatNode.members.some(
        (m: RelayMember): boolean => m.user?.id === me.id,
      );
    }
    return false;
  }, [chatNode, me, isOptimisticJoined]);

  const normalizedChatType = useMemo((): "PRIVATE" | "GROUP" | "CHANNEL" => {
    const type: string | undefined = chatNode?.type;
    if (type === "DIRECT" || type === "PRIVATE") return "PRIVATE";
    if (type === "GROUP") return "GROUP";
    return "CHANNEL";
  }, [chatNode?.type]);

  const partnerUser = useMemo((): chatHeader_user$key | null => {
    if (!chatNode?.members || !me) return null;
    const partner = chatNode.members.find(
      (m: RelayMember): boolean => m.user?.id !== me.id,
    );
    return partner?.user
      ? (partner.user as unknown as chatHeader_user$key)
      : null;
  }, [chatNode, me]);

  const { messages: messagesFromHistory, isLoading: historyLoading } =
    useChatHistory(chatId);

  const { sendMessage, editMessage, markAsRead, joinChat } =
    useMessageActions(chatId);
  const { handleKeyPress, stopTyping: stopTypingHook } = useSendTyping(chatId);

  const canWrite: boolean = chatNode?.canWrite ?? true;
  const isInitialLoading: boolean = isFirstLoad && historyLoading;
  const isNotFound: boolean =
    !chatNode && !isInitialLoading && chatRaw?.__typename !== "InternalError";

  const allMessages: readonly Message[] = useMemo((): readonly Message[] => {
    const raw = (messagesFromHistory ?? []) as unknown as Message[];
    return [...raw]
      .filter((m: Message): boolean => !!m)
      .sort((a: Message, b: Message): number => {
        const seqA: number = Number(a.sequence) || 0;
        const seqB: number = Number(b.sequence) || 0;
        if (seqA !== seqB) return seqA - seqB;
        return new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
      });
  }, [messagesFromHistory]);

  const lastSequence: number = useMemo((): number => {
    if (allMessages.length === 0) return 0;
    return Number(allMessages[allMessages.length - 1].sequence) || 0;
  }, [allMessages]);

  const { checkAndMarkRead } = useMarkDialog(
    (chatNode ? chatNode : null) as unknown as useMarkDialog_chat$key,
    lastSequence,
    me?.id,
  );

  useEffect((): (() => void) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!historyLoading && chatNode) {
      timer = setTimeout((): void => {
        setIsFirstLoad(false);
      }, 100);
    }
    return (): void => {
      if (timer) clearTimeout(timer);
    };
  }, [historyLoading, chatNode]);

  useEffect((): (() => void) => {
    setActiveChatId(chatId);
    return (): void => {
      setActiveChatId(null);
    };
  }, [chatId, setActiveChatId]);

  const cancelAction = useCallback((): void => {
    setReplyingTo(null);
    setEditingMessage(null);
    resetInput();
    stopTypingHook();
  }, [resetInput, stopTypingHook]);

  const handleEditInitiate = useCallback(
    (msg: messageBubble_message$data): void => {
      const fullMsg: Message = msg as unknown as Message;
      setReplyingTo(null);
      setEditingMessage(fullMsg);
      setInput(fullMsg.text);
    },
    [setInput],
  );

  const handleReplyInitiate = useCallback(
    (msg: messageBubble_message$data): void => {
      setEditingMessage(null);
      setReplyingTo(msg as unknown as Message);
    },
    [],
  );

  const handleDeleteMessage = useCallback((id: string): void => {
    void id;
  }, []);

  const handleForwardMessage = useCallback(
    (msg: messageBubble_message$data): void => {
      void msg;
    },
    [],
  );

  const handleTyping = useCallback(
    (isTyping: boolean): void => {
      if (isTyping) {
        handleKeyPress();
      } else {
        stopTypingHook();
      }
    },
    [handleKeyPress, stopTypingHook],
  );

  const handleJoin = useCallback((): void => {
    const slug: string | undefined = chatNode?.slug;
    if (joinChat && slug) {
      setIsOptimisticJoined(true);
      joinChat(slug)
        .then((): void => {
          toast.success("Successfully joined the chat");
        })
        .catch((): void => {
          setIsOptimisticJoined(false);
          toast.error("Failed to join the chat");
        });
    }
  }, [joinChat, chatNode?.slug]);

  const totalUnread: number = useMemo((): number => {
    const myChatsResult = chatsData.myChats;
    if (myChatsResult?.__typename === "ChatList") {
      return myChatsResult.chats.reduce((acc: number, c): number => {
        if (c?.id === chatId) return acc;
        return acc + (c?.unreadCount ?? 0);
      }, 0);
    }
    return 0;
  }, [chatsData.myChats, chatId]);

  const isBotChat: boolean = useMemo((): boolean => {
    if (!chatNode?.members || !me || normalizedChatType !== "PRIVATE")
      return false;
    const otherMember = chatNode.members.find(
      (m: RelayMember): boolean => m?.user?.id !== me.id,
    );
    return otherMember?.user?.isBot ?? false;
  }, [chatNode, me, normalizedChatType]);

  useEffect((): (() => void) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const triggerRead = (): void => {
      if (
        document.visibilityState === "visible" &&
        lastSequence > 0 &&
        isAtBottom
      ) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout((): void => {
          checkAndMarkRead();
          markAsRead();
        }, 300);
      }
    };
    triggerRead();
    window.addEventListener("visibilitychange", triggerRead);
    window.addEventListener("focus", triggerRead);
    return (): void => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("visibilitychange", triggerRead);
      window.removeEventListener("focus", triggerRead);
    };
  }, [checkAndMarkRead, markAsRead, lastSequence, isAtBottom]);

  const handleSend = useCallback(
    (text?: string, attachments: File[] = []): void => {
      const val: string = (text ?? inputRef.current).trim();

      if ((!val && attachments.length === 0) || !me) {
        return;
      }

      if (editingMessage) {
        editMessage(editingMessage.id, val)
          .then((): void => {
            cancelAction();
          })
          .catch((): void => {
            toast.error("Failed to edit message");
          });
        return;
      }

      const originalReply: Message | null = replyingTo;
      const tempId: string = `temp-${Date.now()}`;
      const extendedMe: ExtendedUser = me as unknown as ExtendedUser;

      cancelAction();

      sendMessage(val, attachments, {
        optimisticResponse: {
          sendMessage: {
            __typename: "Message",
            id: tempId,
            chatId,
            text: val,
            sentAt: new Date().toISOString(),
            sequence:
              allMessages.length > 0
                ? (Number(allMessages[allMessages.length - 1].sequence) || 0) +
                  1
                : 1,
            isEdited: false,
            sender: {
              id: extendedMe.id,
              firstName: extendedMe.firstName,
              lastName: extendedMe.lastName ?? null,
              photoUrl: extendedMe.photoUrl ?? null,
              displayName: extendedMe.displayName ?? extendedMe.firstName,
            },
            replyTo: originalReply
              ? {
                  id: originalReply.id,
                  text: originalReply.text,
                  sender: {
                    id: originalReply.sender.id,
                    firstName: originalReply.sender.firstName,
                    lastName: originalReply.sender.lastName ?? null,
                    displayName: originalReply.sender.displayName,
                  },
                }
              : null,
          },
        },
      })
        .then((): void => {})
        .catch((): void => {
          setInput(val);
          if (originalReply) setReplyingTo(originalReply);
          toast.error("Message not sent");
        });
    },
    [
      me,
      chatId,
      allMessages,
      sendMessage,
      editMessage,
      editingMessage,
      replyingTo,
      cancelAction,
      setInput,
    ],
  );

  if (isNotFound) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-background p-6 text-center">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h2 className="text-xl font-bold mb-2">Chat not found</h2>
        <p className="text-muted-foreground text-sm max-w-70 mb-8">
          The chat doesn't exist or you don't have access.
        </p>
        <button
          className="gap-2 rounded-xl flex items-center px-4 py-2 border hover:bg-muted"
          onClick={(): Promise<void> => navigate({ to: "/" })}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to chats
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background w-full overflow-hidden">
      <ChatHeader
        id={chatId}
        title={chatNode?.title}
        photoUrl={chatNode?.photoUrl ?? undefined}
        userRef={normalizedChatType === "PRIVATE" ? partnerUser : null}
        totalUnread={totalUnread}
        isLoading={isInitialLoading}
        type={normalizedChatType}
        membersCount={chatNode?.membersCount ?? 0}
      />
      <main className="flex-1 relative min-h-0 bg-background overflow-hidden">
        {isInitialLoading ? (
          <div className="absolute inset-0 p-4 flex flex-col gap-6">
            <Skeleton className="h-10 w-[60%] self-end rounded-2xl" />
            <Skeleton className="h-10 w-[50%] self-start rounded-2xl" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="bg-muted/50 text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm">
              {isBotChat ? "What can this bot do?" : "No messages yet"}
            </div>
          </div>
        ) : (
          <MessageList
            chatId={chatId}
            messages={
              messagesFromHistory as unknown as messageList_metadata$key
            }
            myId={me?.id}
            chatType={normalizedChatType}
            lastReadSequence={Number(chatNode?.lastReadSequence) || 0}
            canWrite={canWrite}
            onMarkRead={markAsRead}
            onReply={handleReplyInitiate}
            onEdit={handleEditInitiate}
            onDelete={handleDeleteMessage}
            onForward={handleForwardMessage}
            onScrollAtBottomChange={setIsAtBottom}
          />
        )}
      </main>
      {!isInitialLoading && (
        <MessageComposer
          isBot={isBotChat}
          isEmpty={allMessages.length === 0}
          input={input}
          setInput={setInput}
          onSend={handleSend}
          onJoin={handleJoin}
          onTyping={handleTyping}
          disabled={false}
          replyingTo={replyingTo}
          editingMessage={editingMessage}
          onCancelAction={cancelAction}
          canWrite={canWrite}
          isMember={isMember}
          chatType={normalizedChatType}
        />
      )}
    </div>
  );
}
