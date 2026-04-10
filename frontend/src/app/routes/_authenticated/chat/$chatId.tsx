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
  type ChatDetailsResponse,
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
import type { useMarkDialog_chat$key } from "@/features/chat/lib/chat/__generated__/useMarkDialog_chat.graphql";
import type { useMessageActionsSendMutation$data } from "@/features/chat/lib/messages/__generated__/useMessageActionsSendMutation.graphql";
import type { useMeQuery$data } from "@/features/chat/lib/common/__generated__/useMeQuery.graphql";

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

  const { input, setInput, resetInput, setActiveChatId } = useChatStore();
  const inputRef: MutableRefObject<string> = useRef<string>(input);

  useEffect((): void => {
    inputRef.current = input;
  }, [input]);

  const meData: useMeQuery$data = useMe();
  const chatData: ChatDetailsResponse = useChatDetails(chatId);
  const chatsData: MyChatsResponse = useMyChats();

  const me: User | undefined = meData?.me as unknown as User | undefined;

  const chatRaw: ChatDetailsResponse["chat"] = chatData.chat;
  const isChatType: boolean = chatRaw?.__typename === "Chat";
  const chat: Chat | undefined = isChatType
    ? (chatRaw as unknown as Chat)
    : undefined;

  const chatError: unknown = !isChatType ? chatRaw : null;
  const typingFromSub: { isTyping: boolean; userId: string } | null =
    useTypingSubscription(chatId);

  const { messages: messagesFromHistory, isLoading: historyLoading } =
    useChatHistory(chatId);

  const { sendMessage, editMessage } = useMessageActions(chatId);
  const { sendTyping } = useSendTyping(chatId);

  const isInitialLoading: boolean = isFirstLoad && historyLoading;
  const isNotFound: boolean = !chat && !isInitialLoading && !!chatError;

  const lastSequence: number = useMemo((): number => {
    if (!messagesFromHistory || messagesFromHistory.length === 0) return 0;
    const lastMsg: Message = messagesFromHistory[
      messagesFromHistory.length - 1
    ] as unknown as Message;
    return (lastMsg.sequence as number) ?? 0;
  }, [messagesFromHistory]);

  const { checkAndMarkRead } = useMarkDialog(
    chatRaw as unknown as useMarkDialog_chat$key,
    lastSequence,
    me?.id,
  );

  useEffect((): void | (() => void) => {
    if (!historyLoading && chat) {
      const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
        setIsFirstLoad(false);
      }, 100);
      return (): void => clearTimeout(timer);
    }
  }, [historyLoading, chat]);

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

  const totalUnread: number = useMemo((): number => {
    const myChats: MyChatsResponse["myChats"] = chatsData.myChats;
    if (myChats?.__typename === "ChatList") {
      return (myChats.chats ?? []).reduce(
        (
          acc: number,
          c: { readonly id: string; readonly unreadCount?: number | null },
        ): number => {
          const unread: number = c.unreadCount ?? 0;
          return c.id === chatId ? acc : acc + unread;
        },
        0,
      );
    }
    return 0;
  }, [chatsData, chatId]);

  const typingUser: User | undefined = useMemo((): User | undefined => {
    if (!chat?.members || !me || !typingFromSub) return undefined;
    if (typingFromSub.isTyping && typingFromSub.userId !== me.id) {
      const members: ChatMember[] = chat.members as ChatMember[];
      const subUser: User | undefined = members.find(
        (m: ChatMember): boolean => m.user.id === typingFromSub.userId,
      )?.user;
      if (subUser) return subUser;
    }
    return undefined;
  }, [chat, me, typingFromSub]);

  const isBotChat: boolean = useMemo((): boolean => {
    if (!chat?.members || !me) return false;
    const members: ChatMember[] = chat.members as ChatMember[];
    const otherMember: ChatMember | undefined = members.find(
      (m: ChatMember): boolean => m.user.id !== me.id,
    );
    return otherMember?.user.isBot ?? false;
  }, [chat, me]);

  const allMessages: readonly Message[] = useMemo((): readonly Message[] => {
    const rawMessages: Message[] = (messagesFromHistory ??
      []) as unknown as Message[];
    return [...rawMessages].sort((a: Message, b: Message): number => {
      const timeA: number = new Date(a.sentAt).getTime();
      const timeB: number = new Date(b.sentAt).getTime();
      if (Math.abs(timeA - timeB) > 3000) return timeA - timeB;
      return (a.sequence ?? 0) - (b.sequence ?? 0);
    });
  }, [messagesFromHistory]);

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
                  ? (allMessages[allMessages.length - 1].sequence ?? 0) + 1
                  : 1,
              sender: {
                id: me.id,
                firstName: me.firstName,
                photoUrl: me.photoUrl,
              },
            },
          } as useMessageActionsSendMutation$data,
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
        members={chat?.members as ChatMember[]}
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
            members={chat?.members as ChatMember[]}
            myId={me?.id}
            lastReadSequence={chat?.lastReadSequence ?? 0}
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
