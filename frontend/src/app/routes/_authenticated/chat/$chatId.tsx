import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  type MutableRefObject,
  useRef,
  type ReactNode,
} from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { Message, User, ChatMember } from "@/entities/chat/model/types";
import type { useMarkDialog_chat$key } from "@/features/chat/lib/chat/__generated__/useMarkDialog_chat.graphql";
import type { useMessageActionsSendMutation$data } from "@/features/chat/lib/messages/__generated__/useMessageActionsSendMutation.graphql";
import type { useMeQuery$data } from "@/features/chat/lib/common/__generated__/useMeQuery.graphql";
import type { chatHeader_user$key } from "@/features/chat/ui/__generated__/chatHeader_user.graphql";
import type { useChatsDetailsQuery$data } from "@/features/chat/lib/chat/__generated__/useChatsDetailsQuery.graphql";

type ChatNode = Extract<
  useChatsDetailsQuery$data["chat"],
  { readonly __typename: "Chat" }
>;

type RelayMember = NonNullable<ChatNode["members"]>[number];

interface ExtendedUser extends Omit<User, "lastName"> {
  lastName?: string | null;
  displayName?: string | null;
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

  const { input, setInput, resetInput, setActiveChatId } =
    useChatStore() as ChatStoreState;
  const inputRef: MutableRefObject<string> = useRef<string>(input);

  useEffect((): void => {
    inputRef.current = input;
  }, [input]);

  const meData: useMeQuery$data = useMe();
  const chatData: ChatDetailsResponse = useChatDetails(chatId);
  const chatsData: MyChatsResponse = useMyChats();

  const me: User | undefined = meData?.me as unknown as User | undefined;
  const chatRaw = chatData.chat;
  const isChatType: boolean = chatRaw?.__typename === "Chat";
  const chatNode: ChatNode | null = isChatType ? (chatRaw as ChatNode) : null;

  const partnerUser = useMemo((): chatHeader_user$key | null => {
    if (!chatNode?.members || !me) return null;
    const partner = chatNode.members.find(
      (m: RelayMember): boolean =>
        m.user?.id !== undefined && m.user.id !== me.id,
    );
    return (partner?.user as unknown as chatHeader_user$key) ?? null;
  }, [chatNode, me]);

  const { messages: messagesFromHistory, isLoading: historyLoading } =
    useChatHistory(chatId);

  const { sendMessage, editMessage, markAsRead } = useMessageActions(chatId);
  const { handleKeyPress, stopTyping } = useSendTyping(chatId);

  const canWrite: boolean = chatNode ? chatNode.canWrite : true;
  const isInitialLoading: boolean = isFirstLoad && historyLoading;
  const isNotFound: boolean =
    !chatNode && !isInitialLoading && chatRaw?.__typename !== "InternalError";

  const lastSequence: number = useMemo((): number => {
    if (!messagesFromHistory || messagesFromHistory.length === 0) return 0;
    const lastMsg: Message = messagesFromHistory[
      messagesFromHistory.length - 1
    ] as unknown as Message;
    return Number(lastMsg.sequence) || 0;
  }, [messagesFromHistory]);

  const { checkAndMarkRead } = useMarkDialog(
    (isChatType ? chatRaw : null) as unknown as useMarkDialog_chat$key,
    lastSequence,
    me?.id,
  );

  useEffect((): void | (() => void) => {
    if (!historyLoading && chatNode) {
      const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
        setIsFirstLoad(false);
      }, 100);
      return (): void => clearTimeout(timer);
    }
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
    stopTyping();
  }, [resetInput, stopTyping]);

  const handleEditInitiate = useCallback(
    (msg: Message): void => {
      setReplyingTo(null);
      setEditingMessage(msg);
      setInput(msg.text);
    },
    [setInput],
  );

  const handleReplyInitiate = useCallback((msg: Message): void => {
    setEditingMessage(null);
    setReplyingTo(msg);
  }, []);

  const handleTyping = useCallback(
    (isTyping: boolean): void => {
      if (isTyping) {
        handleKeyPress();
      } else {
        stopTyping();
      }
    },
    [handleKeyPress, stopTyping],
  );

  const totalUnread: number = useMemo((): number => {
    const myChatsResult = chatsData.myChats;

    if (
      myChatsResult?.__typename === "ChatList" &&
      Array.isArray(myChatsResult.chats)
    ) {
      return myChatsResult.chats.reduce((acc: number, c): number => {
        const unread: number = c?.unreadCount ?? 0;
        const isCurrentChat: boolean = c?.id === chatId;

        return isCurrentChat ? acc : acc + unread;
      }, 0);
    }

    return 0;
  }, [chatsData.myChats, chatId]);

  const isBotChat: boolean = useMemo((): boolean => {
    if (!chatNode?.members || !me) return false;
    const otherMember = chatNode.members.find(
      (m: RelayMember): boolean =>
        m?.user?.id !== undefined && m.user.id !== me.id,
    );
    return otherMember?.user?.isBot ?? false;
  }, [chatNode, me]);

  const allMessages: readonly Message[] = useMemo((): readonly Message[] => {
    const rawMessages: Message[] = (messagesFromHistory ??
      []) as unknown as Message[];
    return [...rawMessages]
      .filter((m: Message | null): boolean => m !== null && m !== undefined)
      .sort((a: Message, b: Message): number => {
        const timeA: number = new Date(a.sentAt).getTime();
        const timeB: number = new Date(b.sentAt).getTime();
        if (Math.abs(timeA - timeB) > 3000) return timeA - timeB;
        return (Number(a.sequence) || 0) - (Number(b.sequence) || 0);
      });
  }, [messagesFromHistory]);

  useEffect((): void | (() => void) => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        clearTimeout(timeoutId);
        timeoutId = setTimeout((): void => {
          checkAndMarkRead();
          markAsRead();
        }, 100);
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return (): void => {
      clearTimeout(timeoutId);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [checkAndMarkRead, markAsRead]);

  const handleSend = useCallback(
    (text?: string): void => {
      const val: string = (text ?? inputRef.current).trim();
      if (!val || !me) return;

      if (editingMessage) {
        editMessage(editingMessage.id, val)
          .then((): void => cancelAction())
          .catch((err: Error): void => console.error(err));
        return;
      }

      const originalReply: Message | null = replyingTo;
      const tempId: string = `temp-${Date.now()}`;
      const extendedMe: ExtendedUser = me as unknown as ExtendedUser;

      cancelAction();

      sendMessage(val, {
        variables: {
          chatId,
          text: val,
          replyToId: originalReply?.id ?? null,
        },
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
        } as useMessageActionsSendMutation$data,
      }).catch((): void => {
        setInput(val);
        if (originalReply) setReplyingTo(originalReply);
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
          The chat doesn't exist or you don't have permission to view it.
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
        userRef={
          (chatNode?.type as string) === "PRIVATE" ||
          (chatNode?.type as string) === "DIRECT"
            ? partnerUser
            : null
        }
        totalUnread={totalUnread}
        isLoading={isInitialLoading}
        type={
          ((chatNode?.type as string) === "DIRECT"
            ? "PRIVATE"
            : chatNode?.type) as "PRIVATE" | "GROUP" | "CHANNEL"
        }
        membersCount={chatNode?.membersCount ?? 0}
      />

      <main className="flex-1 relative min-h-0 bg-background overflow-hidden">
        {isInitialLoading ? (
          <div className="absolute inset-0 p-4 flex flex-col gap-6">
            <Skeleton className="h-10 w-[60%] self-end rounded-2xl" />
            <Skeleton className="h-10 w-[50%] self-start rounded-2xl" />
          </div>
        ) : (
          <MessageList
            chatId={chatId}
            messages={allMessages}
            members={(chatNode?.members as unknown as ChatMember[]) ?? []}
            myId={me?.id}
            lastReadSequence={Number(chatNode?.lastReadSequence) || 0}
            onMarkRead={markAsRead}
            onReply={handleReplyInitiate}
            onEdit={handleEditInitiate}
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
          onTyping={handleTyping}
          disabled={false}
          replyingTo={replyingTo}
          editingMessage={editingMessage}
          onCancelAction={cancelAction}
          canWrite={canWrite}
        />
      )}
    </div>
  );
}
