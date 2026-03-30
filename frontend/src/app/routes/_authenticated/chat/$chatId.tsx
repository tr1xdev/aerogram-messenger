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

interface SentCacheEntry {
  id: string;
  time: number;
  text: string;
}

const MATCH_THRESHOLD_MS: number = 5000;

export const Route = createFileRoute("/_authenticated/chat/$chatId")({
  component: ChatRoute,
});

function ChatRoute(): ReactNode {
  const { chatId } = Route.useParams();
  return <ChatPage key={chatId} chatId={chatId} />;
}

export function ChatPage({ chatId }: { chatId: string }): ReactNode {
  const navigate = useNavigate();
  const [optimisticMsgs, setOptimisticMsgs] = useState<Message[]>([]);
  const [sentCache, setSentCache] = useState<SentCacheEntry[]>([]);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [decryptedReplyText, setDecryptedReplyText] = useState<string>("");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true);

  const { input, setInput, resetInput, setActiveChatId } = useChatStore();
  const inputRef = useRef<string>(input);

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

  const { sendMessage, editMessage, decryptMessage } =
    useMessageActions(chatId);
  const { sendTyping } = useSendTyping(chatId);

  const { data: chatsData } = useMyChats();

  const isInitialLoading: boolean =
    (!chat && chatLoading) || (historyLoading && isFirstLoad);
  const isNotFound: boolean =
    (!chat && !chatLoading && !!chatError) ||
    (!chat && !chatLoading && !!chatData && !chatData.chat);

  useEffect((): void | (() => void) => {
    if (!historyLoading && !chatLoading && chat) {
      const timer: ReturnType<typeof setTimeout> = setTimeout((): void => {
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

  useEffect((): void => {
    if (replyingTo) {
      decryptMessage(replyingTo).then((text: string): void =>
        setDecryptedReplyText(text),
      );
    } else {
      setDecryptedReplyText("");
    }
  }, [replyingTo, decryptMessage]);

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
      const subUser = chat.members.find(
        (m: ChatMember): boolean => m.user.id === typingFromSub.id,
      )?.user;
      if (subUser) return subUser;
    }
    const typingMember: ChatMember | undefined = chat.members.find(
      (m: ChatMember): boolean =>
        m.user.id !== me.id && m.user.isTyping === true,
    );
    return typingMember?.user;
  }, [chat?.members, me, typingFromSub]);

  const isBotChat = useMemo((): boolean => {
    if (!chat?.members || !me) return false;
    const otherMember = chat.members.find(
      (m: ChatMember): boolean => m.user.id !== me.id,
    );
    return otherMember?.user.isBot ?? false;
  }, [chat?.members, me]);

  const allMessages = useMemo((): Message[] => {
    if (!me || !chatId) return messagesFromHistory;

    const usedCacheIds: Set<string> = new Set<string>();
    const serverIds: Set<string> = new Set(
      messagesFromHistory.map((m: Message): string => m.id),
    );

    const patchedServerMessages: Message[] = messagesFromHistory.map(
      (m: Message): Message => {
        const isCurrentlySending: boolean = sendingIds.has(m.id);
        if (m.sender.id === me.id && m.isEncrypted) {
          const msgTime: number = new Date(m.sentAt).getTime();
          const match: SentCacheEntry | undefined = sentCache.find(
            (c: SentCacheEntry): boolean =>
              !usedCacheIds.has(c.id) &&
              Math.abs(c.time - msgTime) < MATCH_THRESHOLD_MS,
          );
          if (match) {
            usedCacheIds.add(match.id);
            return {
              ...m,
              isEncrypted: false,
              text: match.text,
              isSending: isCurrentlySending,
            };
          }
        }
        return isCurrentlySending ? { ...m, isSending: true } : m;
      },
    );

    const filteredOptimistic: Message[] = optimisticMsgs.filter(
      (om: Message): boolean => {
        if (serverIds.has(om.id)) return false;
        const omTime: number = new Date(om.sentAt).getTime();
        return !messagesFromHistory.some(
          (m: Message): boolean =>
            m.sender.id === me.id &&
            Math.abs(new Date(m.sentAt).getTime() - omTime) < 2000,
        );
      },
    );

    const result: Message[] = [...patchedServerMessages, ...filteredOptimistic];

    return result.sort((a: Message, b: Message): number => {
      const timeA: number = new Date(a.sentAt).getTime();
      const timeB: number = new Date(b.sentAt).getTime();
      if (Math.abs(timeA - timeB) > 3000) return timeA - timeB;
      if (a.sequence !== undefined && b.sequence !== undefined)
        return a.sequence - b.sequence;
      return timeA - timeB;
    });
  }, [messagesFromHistory, optimisticMsgs, me, sentCache, sendingIds, chatId]);

  const { checkAndMarkRead } = useMarkDialog(
    chatId,
    allMessages,
    me ?? undefined,
  );

  useEffect((): void => {
    if (allMessages.length > 0 && !isFirstLoad) {
      checkAndMarkRead();
    }
  }, [allMessages.length, checkAndMarkRead, isFirstLoad]);

  const handleSend = useCallback(
    async (overrideText?: string): Promise<void> => {
      const val: string = (overrideText ?? inputRef.current).trim();
      if (!val || !me) return;

      if (editingMessage) {
        try {
          await editMessage(editingMessage.id, val);
          cancelAction();
        } catch {
          /* error handled by hook */
        }
        return;
      }

      const nowTime: number = Date.now();
      const tempId: string = crypto.randomUUID();
      const currentReplyId: string | undefined = replyingTo?.id;
      const originalReply: Message | null = replyingTo;

      const newMsg: Message = {
        id: tempId,
        chatId,
        text: val,
        sentAt: new Date(nowTime).toISOString(),
        isRead: false,
        isEdited: false,
        isEncrypted: false,
        isSending: true,
        sender: me,
        replyTo: originalReply || undefined,
      };

      setSendingIds(
        (prev: Set<string>): Set<string> => new Set(prev).add(tempId),
      );
      setSentCache((prev: SentCacheEntry[]): SentCacheEntry[] => {
        const next: SentCacheEntry[] = [
          ...prev,
          { id: tempId, time: nowTime, text: val },
        ];
        return next.length > 50 ? next.slice(-50) : next;
      });
      setOptimisticMsgs((prev: Message[]): Message[] => [...prev, newMsg]);

      cancelAction();

      try {
        await sendMessage(val, { variables: { replyToId: currentReplyId } });
      } catch {
        setInput(val);
        if (originalReply) setReplyingTo(originalReply);
        setSentCache((prev: SentCacheEntry[]): SentCacheEntry[] =>
          prev.filter((c: SentCacheEntry): boolean => c.id !== tempId),
        );
      } finally {
        setSendingIds((prev: Set<string>): Set<string> => {
          const next: Set<string> = new Set(prev);
          next.delete(tempId);
          return next;
        });
        setOptimisticMsgs((prev: Message[]): Message[] =>
          prev.filter((m: Message): boolean => m.id !== tempId),
        );
      }
    },
    [
      chatId,
      me,
      sendMessage,
      editMessage,
      editingMessage,
      replyingTo,
      cancelAction,
      setInput,
    ],
  );

  const replyPreview = useMemo((): (Message & { text: string }) | null => {
    if (!replyingTo) return null;
    return { ...replyingTo, text: decryptedReplyText };
  }, [replyingTo, decryptedReplyText]);

  if (isNotFound) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-background p-6 text-center">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h2 className="text-xl font-bold mb-2">Chat not found</h2>
        <p className="text-muted-foreground text-sm max-w-[280px] mb-8">
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
    <div className="flex flex-col h-[100dvh] bg-background w-full fixed inset-0 z-[60] md:relative md:z-auto overflow-hidden">
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
            <p className="text-sm text-muted-foreground max-w-[240px]">
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
          disabled={sendingIds.size > 0 && !editingMessage}
          replyingTo={replyPreview}
          editingMessage={editingMessage}
          onCancelAction={cancelAction}
        />
      )}
    </div>
  );
}
