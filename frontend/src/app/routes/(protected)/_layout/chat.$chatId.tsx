import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, type Variants } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
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
import { MessageSquare } from "lucide-react";
import type { Message, Chat, User } from "@/entities/chat/model/types";

interface SentCacheEntry {
  id: string;
  time: number;
  text: string;
}
const PAGE_VARIANTS: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};
const MATCH_THRESHOLD_MS = 5000;

export const Route = createFileRoute("/(protected)/_layout/chat/$chatId")({
  component: ChatRoute,
});

function ChatRoute() {
  const { chatId } = Route.useParams();
  return <ChatPage key={chatId} chatId={chatId} />;
}

function ChatPage({ chatId }: { chatId: string }) {
  const [optimisticMsgs, setOptimisticMsgs] = useState<Message[]>([]);
  const [sentCache, setSentCache] = useState<SentCacheEntry[]>([]);
  const { input, setInput, resetInput, setActiveChatId } = useChatStore();
  const inputRef = useRef<string>(input);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const { data: meData } = useMe();
  const { data: chatData, loading: chatLoading } = useChatDetails(chatId);
  const { data: messages = [] } = useChatHistory(chatId);
  const { sendMessage, isSending } = useChatActions(chatId);
  const { data: chatsData } = useMyChats();

  const me: User | undefined = meData?.me;
  const chat: Chat | undefined = chatData?.chat;
  const isInitialLoading = !chat && chatLoading;

  useGlobalSubscriptions(chatId, me?.id);

  useEffect(() => {
    setActiveChatId(chatId);
    return () => setActiveChatId(null);
  }, [chatId, setActiveChatId]);

  const totalUnread = useMemo((): number => {
    const myChats: Chat[] = chatsData?.myChats ?? [];
    return myChats.reduce(
      (acc: number, c: Chat) =>
        c.id === chatId ? acc : acc + (c.unreadCount ?? 0),
      0,
    );
  }, [chatsData?.myChats, chatId]);

  const allMessages = useMemo((): Message[] => {
    if (!me) return messages;
    const serverIds = new Set<string>(messages.map((m) => m.id));
    const usedCacheIds = new Set<string>();

    const patchedServerMessages = messages.map((m: Message): Message => {
      if (m.sender.id === me.id && m.isEncrypted) {
        const msgTime = new Date(m.sentAt).getTime();
        const match = sentCache.find(
          (c) =>
            !usedCacheIds.has(c.id) &&
            Math.abs(c.time - msgTime) < MATCH_THRESHOLD_MS,
        );
        if (match) {
          usedCacheIds.add(match.id);
          return { ...m, isEncrypted: false, text: match.text };
        }
      }
      return m;
    });

    const filteredOptimistic = optimisticMsgs.filter((om: Message): boolean => {
      if (serverIds.has(om.id)) return false;
      const omTime = new Date(om.sentAt).getTime();
      return !messages.some(
        (m) =>
          m.sender.id === me.id &&
          Math.abs(new Date(m.sentAt).getTime() - omTime) < 2000,
      );
    });

    return [...patchedServerMessages, ...filteredOptimistic].sort((a, b) => {
      const timeA = new Date(a.sentAt).getTime();
      const timeB = new Date(b.sentAt).getTime();
      if (Math.abs(timeA - timeB) > 2000) return timeA - timeB;
      return (a.sequence ?? 0) - (b.sequence ?? 0) || timeA - timeB;
    });
  }, [messages, optimisticMsgs, me, sentCache]);

  const { checkAndMarkRead } = useMarkDialog(
    chatId,
    allMessages,
    me,
    chat?.lastReadSequence,
  );

  useEffect(() => {
    checkAndMarkRead();
  }, [allMessages, checkAndMarkRead]);

  const handleSend = useCallback(async (): Promise<void> => {
    const currentInput = inputRef.current.trim();
    if (!currentInput || isSending || !me) return;
    const nowTime = Date.now();
    const tempId = crypto.randomUUID();

    setSentCache((prev) => {
      const next = [...prev, { id: tempId, time: nowTime, text: currentInput }];
      return next.length > 50 ? next.slice(-50) : next;
    });

    setOptimisticMsgs((prev) => [
      ...prev,
      {
        id: tempId,
        chatId,
        text: currentInput,
        sentAt: new Date(nowTime).toISOString(),
        isRead: false,
        isEdited: false,
        isEncrypted: false,
        sender: me,
      },
    ]);
    resetInput();

    try {
      await sendMessage(currentInput);
    } catch {
      setInput(currentInput);
      setSentCache((prev) => prev.filter((c) => c.id !== tempId));
    } finally {
      setOptimisticMsgs((prev) => prev.filter((m) => m.id !== tempId));
    }
  }, [chatId, isSending, me, resetInput, sendMessage, setInput]);

  return (
    <div className="flex flex-col h-full bg-background w-full fixed inset-0 z-60 md:relative md:z-auto overflow-hidden">
      <ChatHeader
        title={chat?.title}
        photoUrl={chat?.photoUrl}
        totalUnread={totalUnread}
        members={chat?.members}
        meId={me?.id}
        chatId={chatId}
      />

      <main className="flex-1 relative overflow-hidden bg-background">
        {isInitialLoading ? (
          <motion.div
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
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
            <MessageSquare className="h-16 w-16 mb-4 stroke-1" />
            <p className="font-medium text-sm">No messages here yet</p>
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

      <footer className="shrink-0 border-t border-border/40 bg-background/80 backdrop-blur-lg">
        <MessageComposer
          input={input}
          setInput={setInput}
          onSend={handleSend}
          disabled={isSending}
        />
      </footer>
    </div>
  );
}
