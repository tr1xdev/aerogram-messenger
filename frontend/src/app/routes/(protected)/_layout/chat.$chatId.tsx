import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, type Variants } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chat";
import {
  useChatHistory,
  useChatActions,
  useMe,
  useChatDetails,
  useMyChats,
} from "@/features/chat/lib/use-messages";
import { useMarkDialog } from "@/features/chat/lib/use-mark-dialog";
import { useGlobalSubscriptions } from "@/features/chat/lib/use-global-subscription";
import { ChatHeader } from "@/features/chat/ui/chat-header";
import { MessageList } from "@/features/chat/ui/message-list";
import { MessageComposer } from "@/features/chat/ui/message-composer";
import { MessageSquare, AlertCircle, ArrowLeft } from "lucide-react";
import type { Message, Chat, User } from "@/entities/chat/model/types";

interface SentCacheEntry {
  id: string;
  time: number;
  text: string;
}

const PAGE_VARIANTS: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
};

const MATCH_THRESHOLD_MS = 5000;

export const Route = createFileRoute("/(protected)/_layout/chat/$chatId")({
  component: ChatRoute,
});

function ChatRoute() {
  const { chatId } = Route.useParams();
  return <ChatPage key={chatId} chatId={chatId} />;
}

export function ChatPage({ chatId }: { chatId: string }) {
  const navigate: ReturnType<typeof useNavigate> = useNavigate();
  const [optimisticMsgs, setOptimisticMsgs] = useState<Message[]>([]);
  const [sentCache, setSentCache] = useState<SentCacheEntry[]>([]);

  const { input, setInput, resetInput, setActiveChatId } = useChatStore();
  const inputRef: React.MutableRefObject<string> = useRef<string>(input);

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

  const currentId: string = chat?.id || "";

  const { data: messages = [], isLoading: historyLoading } =
    useChatHistory(currentId);
  const { sendMessage, isSending } = useChatActions(currentId);
  const { data: chatsData } = useMyChats();

  const isInitialLoading: boolean = !chat && chatLoading;
  const isNotFound: boolean =
    (!chat && !chatLoading && !!chatError) ||
    (!chat && !chatLoading && !!chatData);

  useGlobalSubscriptions(currentId, me?.id);

  useEffect((): (() => void) => {
    if (currentId) {
      setActiveChatId(currentId);
    }
    return (): void => {
      if (currentId) setActiveChatId(null);
    };
  }, [currentId, setActiveChatId]);

  const totalUnread = useMemo((): number => {
    if (!chatsData?.myChats || !currentId) return 0;
    return chatsData.myChats.reduce((acc: number, c: Chat): number => {
      return c.id === currentId ? acc : acc + (c.unreadCount ?? 0);
    }, 0);
  }, [chatsData?.myChats, currentId]);

  const allMessages = useMemo((): Message[] => {
    if (!me || !currentId) return messages;

    const serverIds: Set<string> = new Set<string>(
      messages.map((m: Message) => m.id),
    );
    const usedCacheIds: Set<string> = new Set<string>();

    const patchedServerMessages: Message[] = messages.map(
      (m: Message): Message => {
        if (m.sender.id === me.id && m.isEncrypted) {
          const msgTime: number = new Date(m.sentAt).getTime();
          const match: SentCacheEntry | undefined = sentCache.find(
            (c: SentCacheEntry) =>
              !usedCacheIds.has(c.id) &&
              Math.abs(c.time - msgTime) < MATCH_THRESHOLD_MS,
          );
          if (match) {
            usedCacheIds.add(match.id);
            return { ...m, isEncrypted: false, text: match.text };
          }
        }
        return m;
      },
    );

    const filteredOptimistic: Message[] = optimisticMsgs.filter(
      (om: Message): boolean => {
        if (serverIds.has(om.id)) return false;
        const omTime: number = new Date(om.sentAt).getTime();
        return !messages.some(
          (m: Message) =>
            m.sender.id === me.id &&
            Math.abs(new Date(m.sentAt).getTime() - omTime) < 2000,
        );
      },
    );

    return [...patchedServerMessages, ...filteredOptimistic].sort(
      (a: Message, b: Message): number => {
        const timeA: number = new Date(a.sentAt).getTime();
        const timeB: number = new Date(b.sentAt).getTime();
        if (Math.abs(timeA - timeB) > 2000) return timeA - timeB;
        if (a.sequence !== undefined && b.sequence !== undefined) {
          return a.sequence - b.sequence;
        }
        return timeA - timeB;
      },
    );
  }, [messages, optimisticMsgs, me, sentCache, currentId]);

  const { checkAndMarkRead } = useMarkDialog(
    currentId,
    allMessages,
    me,
    chat?.lastReadSequence,
  );

  useEffect((): void => {
    if (currentId && allMessages.length > 0) {
      checkAndMarkRead();
    }
  }, [allMessages.length, checkAndMarkRead, currentId]);

  useEffect((): (() => void) => {
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible" && currentId) {
        checkAndMarkRead();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return (): void =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [checkAndMarkRead, currentId]);

  const handleSend = useCallback(async (): Promise<void> => {
    const currentInput: string = inputRef.current.trim();
    if (!currentInput || isSending || !me || !currentId) return;

    const val: string = currentInput;
    const nowTime: number = Date.now();
    const tempId: string = crypto.randomUUID();

    setSentCache((prev: SentCacheEntry[]): SentCacheEntry[] => {
      const next: SentCacheEntry[] = [
        ...prev,
        { id: tempId, time: nowTime, text: val },
      ];
      return next.length > 50 ? next.slice(-50) : next;
    });

    const newMsg: Message = {
      id: tempId,
      chatId: currentId,
      text: val,
      sentAt: new Date(nowTime).toISOString(),
      isRead: false,
      isEdited: false,
      isEncrypted: false,
      sender: me,
    };

    setOptimisticMsgs((prev: Message[]): Message[] => [...prev, newMsg]);
    resetInput();

    try {
      await sendMessage(val);
    } catch {
      setInput(val);
      setSentCache((prev: SentCacheEntry[]): SentCacheEntry[] =>
        prev.filter((c: SentCacheEntry) => c.id !== tempId),
      );
    } finally {
      setOptimisticMsgs((prev: Message[]): Message[] =>
        prev.filter((m: Message) => m.id !== tempId),
      );
    }
  }, [currentId, isSending, me, resetInput, sendMessage, setInput]);

  if (isNotFound) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-background p-6 text-center animate-in fade-in duration-500">
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
    <div className="flex flex-col h-full bg-background w-full fixed inset-0 z-[60] md:relative md:z-auto overflow-hidden">
      <ChatHeader
        title={chat?.title}
        photoUrl={chat?.photoUrl}
        totalUnread={totalUnread}
        members={chat?.members}
        meId={me?.id}
        isLoading={isInitialLoading}
      />

      <main className="flex-1 relative overflow-hidden bg-background">
        {isInitialLoading ? (
          <motion.div
            key="skeleton"
            variants={PAGE_VARIANTS}
            initial="initial"
            animate="animate"
            className="absolute inset-0 p-6 flex flex-col gap-6"
          >
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-10 w-[60%] rounded-2xl rounded-tr-none" />
            </div>
            <div className="flex flex-col items-start gap-2">
              <Skeleton className="h-10 w-[50%] rounded-2xl rounded-tl-none" />
            </div>
          </motion.div>
        ) : allMessages.length === 0 && !historyLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs">Type a message to start the conversation.</p>
          </div>
        ) : (
          <div className="h-full w-full">
            <MessageList
              messages={allMessages}
              members={chat?.members}
              myId={me?.id}
              lastReadSequence={chat?.lastReadSequence}
              onMarkRead={checkAndMarkRead}
            />
          </div>
        )}
      </main>

      {!isInitialLoading && (
        <footer className="shrink-0 border-t">
          <MessageComposer
            input={input}
            setInput={setInput}
            onSend={handleSend}
            disabled={isSending}
          />
        </footer>
      )}
    </div>
  );
}
