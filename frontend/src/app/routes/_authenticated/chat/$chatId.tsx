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
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chat";
import {
  useChatHistory,
  useMe,
  useChatDetails,
  useMyChats,
  useTypingSubscription,
  useMessageActions,
  useSendTyping,
  type MyChatsResponse,
} from "@/features/chat/lib";
import { useMarkDialog } from "@/features/chat/lib";
import { ChatHeader } from "@/features/chat/ui/chat-header";
import { MessageList } from "@/features/chat/ui/message-list";
import { MessageComposer } from "@/features/chat/ui/message-composer";
import { MessageSquare, AlertCircle, ArrowLeft } from "lucide-react";
import type {
  Message,
  Chat,
  User,
  ChatMember,
} from "@/entities/chat/model/types";

export const Route = createFileRoute("/_authenticated/chat/$chatId")({
  component: ChatRoute,
});

function ChatRoute(): ReactNode {
  const { chatId } = Route.useParams();
  return <ChatPage key={chatId} chatId={chatId} />;
}

export function ChatPage({ chatId }: { chatId: string }): ReactNode {
  const navigate = useNavigate();
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);

  const { input, setInput, resetInput, setActiveChatId } = useChatStore();
  const inputRef: MutableRefObject<string> = useRef<string>(input);

  useEffect((): void => {
    inputRef.current = input;
  }, [input]);

  const { data: meData } = useMe();
  const {
    data: chatData,
    loading: chatLoading,
    error: chatError,
  } = useChatDetails(chatId);

  const me: User | undefined = meData?.me;
  const chat: Chat | undefined = chatData?.chat;

  const typingFromSub = useTypingSubscription(chatId);

  const {
    messages: messagesFromHistory,
    isLoading: historyLoading,
    lastReadSequence,
  } = useChatHistory(chatId);

  const { sendMessage, editMessage } = useMessageActions(chatId);
  const { sendTyping } = useSendTyping(chatId);

  const { data: chatsData } = useMyChats() as {
    data: MyChatsResponse | undefined;
  };

  const isInitialLoading: boolean =
    (!chat && chatLoading) || (historyLoading && isFirstLoad);
  const isNotFound: boolean =
    (!chat && !chatLoading && !!chatError) ||
    (!chat && !chatLoading && !!chatData && !chatData.chat);

  useEffect((): void | (() => void) => {
    if (!historyLoading && !chatLoading && chat) {
      const timer = setTimeout((): void => {
        setIsFirstLoad(false);
      }, 100);
      return (): void => clearTimeout(timer);
    }
  }, [historyLoading, chatLoading, chat]);

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
  }, [resetInput]);

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
      if (sendTyping) sendTyping(isTyping);
    },
    [sendTyping],
  );

  const totalUnread = useMemo((): number => {
    const chats: Chat[] = chatsData?.myChats?.chats || [];
    return chats.reduce((acc: number, c: Chat): number => {
      return c.id === chatId ? acc : acc + (c.unreadCount ?? 0);
    }, 0);
  }, [chatsData, chatId]);

  const typingUser = useMemo((): User | undefined => {
    if (!chat?.members || !me) return undefined;
    if (typingFromSub?.isTyping && typingFromSub.id !== me.id) {
      const subUser: User | undefined = chat.members.find(
        (m: ChatMember): boolean => m.user.id === typingFromSub.id,
      )?.user;
      if (subUser) return subUser;
    }
    const typingMember: ChatMember | undefined = chat.members.find(
      (m: ChatMember): boolean =>
        m.user.id !== me.id && m.user.isTyping === true,
    );
    return typingMember?.user;
  }, [chat, me, typingFromSub]);

  const isBotChat = useMemo((): boolean => {
    if (!chat?.members || !me) return false;
    const otherMember: ChatMember | undefined = chat.members.find(
      (m: ChatMember): boolean => m.user.id !== me.id,
    );
    return otherMember?.user.isBot ?? false;
  }, [chat, me]);

  const allMessages = useMemo((): Message[] => {
    return [...messagesFromHistory].sort((a: Message, b: Message): number => {
      const timeA: number = new Date(a.sentAt).getTime();
      const timeB: number = new Date(b.sentAt).getTime();
      if (Math.abs(timeA - timeB) > 3000) return timeA - timeB;
      if (a.sequence !== undefined && b.sequence !== undefined)
        return a.sequence - b.sequence;
      return timeA - timeB;
    });
  }, [messagesFromHistory]);

  const { checkAndMarkRead } = useMarkDialog(
    chatId,
    allMessages,
    me ?? undefined,
  );

  useEffect((): void | (() => void) => {
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        checkAndMarkRead();
      }
    };
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);
    return (): void => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [checkAndMarkRead]);

  const handleSend = useCallback(
    async (overrideText?: string): Promise<void> => {
      const val: string = (overrideText ?? inputRef.current).trim();
      if (!val || !me) return;

      if (editingMessage) {
        try {
          await editMessage(editingMessage.id, val);
          cancelAction();
        } catch (err: unknown) {
          console.error(err);
        }
        return;
      }

      const originalReply: Message | null = replyingTo;
      const tempId: string = `temp-${Date.now()}`;

      cancelAction();

      try {
        await sendMessage(val, {
          variables: { replyToId: originalReply?.id },
          optimisticResponse: {
            sendMessage: {
              __typename: "Message",
              id: tempId,
              chatId,
              text: val,
              sentAt: new Date().toISOString(),
              isRead: false,
              isEdited: false,
              isEncrypted: false,
              isSending: true,
              forwardedFrom: null,
              sequence:
                allMessages.length > 0
                  ? (allMessages[allMessages.length - 1].sequence ?? 0) + 1
                  : 1,
              sender: {
                ...me,
              },
              replyTo: originalReply
                ? {
                    ...originalReply,
                    __typename: "Message",
                  }
                : null,
            } as Message & { __typename: "Message" },
          },
        });
      } catch (err: unknown) {
        console.error(err);
        setInput(val);
        if (originalReply) setReplyingTo(originalReply);
      }
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
        <Button
          variant="outline"
          onClick={(): Promise<void> => navigate({ to: "/" })}
          className="gap-2 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to chats
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-background w-full fixed inset-0 z-60 md:relative md:z-auto overflow-hidden">
      <ChatHeader
        title={chat?.title ?? undefined}
        photoUrl={chat?.photoUrl ?? undefined}
        totalUnread={totalUnread}
        members={chat?.members}
        meId={me?.id}
        isLoading={isInitialLoading}
        typingUser={typingUser}
      />

      <main className="flex-1 relative min-h-0 bg-background">
        {isInitialLoading ? (
          <div className="absolute inset-0 p-6 flex flex-col gap-6">
            <Skeleton className="h-10 w-[60%] self-end rounded-2xl rounded-tr-none" />
            <Skeleton className="h-10 w-[50%] self-start rounded-2xl rounded-tl-none" />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="relative mb-6">
              <div className="relative h-20 w-20 rounded-3xl bg-muted/50 flex items-center justify-center border border-border/50">
                <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {isBotChat ? `Chat with ${chat?.title}` : "No messages yet"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-60">
              {isBotChat
                ? "Send a message to start."
                : "Start by sending a message."}
            </p>
          </div>
        ) : (
          <MessageList
            chatId={chatId}
            messages={allMessages}
            members={chat?.members}
            myId={me?.id}
            lastReadSequence={lastReadSequence ?? 0}
            onMarkRead={checkAndMarkRead}
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
        />
      )}
    </div>
  );
}
