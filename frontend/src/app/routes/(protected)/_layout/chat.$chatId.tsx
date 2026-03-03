import { useMemo, useState, useEffect, useCallback } from "react";
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
import { ChatHeader } from "@/features/chat/ui/chat-header";
import { MessageList } from "@/features/chat/ui/message-list";
import { MessageComposer } from "@/features/chat/ui/message-composer";
import type { Message, Chat } from "@/entities/chat/model/types";

const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
};

export const Route = createFileRoute("/(protected)/_layout/chat/$chatId")({
  component: ChatPage,
});

function ChatPage() {
  const { chatId } = Route.useParams();
  const [optimisticMsgs, setOptimisticMsgs] = useState<Message[]>([]);
  const [sentCache, setSentCache] = useState<
    Array<{ time: number; text: string; claimed: boolean }>
  >([]);
  const { input, setInput, resetInput, setActiveChatId } = useChatStore();

  const { data: meData } = useMe();
  const { data: chatData, loading: chatLoading } = useChatDetails(chatId);
  const { data: messages = [] } = useChatHistory(chatId);
  const { sendMessage, isSending } = useChatActions(chatId);
  const { data: chatsData } = useMyChats();

  const me = meData?.me;
  const chat = chatData?.chat;
  const isInitialLoading = !chat && chatLoading;

  const totalUnread = useMemo((): number => {
    return (chatsData?.myChats ?? []).reduce((acc: number, c: Chat) => {
      return c.id === chatId ? acc : acc + (c.unreadCount ?? 0);
    }, 0);
  }, [chatsData?.myChats, chatId]);

  const allMessages = useMemo((): Message[] => {
    const serverIds = new Set(messages.map((m: Message) => m.id));
    const localCache = sentCache.map((c) => ({ ...c }));

    const patchedServerMessages = messages.map((m: Message): Message => {
      if (m.sender.id === me?.id && m.isEncrypted) {
        const msgTime = new Date(m.sentAt).getTime();
        const match = localCache.find(
          (c) => !c.claimed && Math.abs(c.time - msgTime) < 15000,
        );
        if (match) {
          match.claimed = true;
          return { ...m, isEncrypted: false, text: match.text };
        }
      }
      return m;
    });

    const filteredOptimistic = optimisticMsgs.filter((om: Message): boolean => {
      if (serverIds.has(om.id)) return false;
      const omTime = new Date(om.sentAt).getTime();
      return !messages.some(
        (m: Message) =>
          m.sender.id === me?.id &&
          Math.abs(new Date(m.sentAt).getTime() - omTime) < 15000,
      );
    });

    return [...patchedServerMessages, ...filteredOptimistic].sort(
      (a: Message, b: Message) => {
        const timeA = new Date(a.sentAt).getTime();
        const timeB = new Date(b.sentAt).getTime();
        if (Math.abs(timeA - timeB) > 1000) {
          return timeA - timeB;
        }
        return (a.sequence ?? 0) - (b.sequence ?? 0);
      },
    );
  }, [messages, optimisticMsgs, me?.id, sentCache]);

  const { checkAndMarkRead } = useMarkDialog(
    chatId,
    allMessages,
    me,
    chat?.lastReadSequence,
  );

  useEffect(() => {
    setActiveChatId(chatId);
    return () => setActiveChatId(null);
  }, [chatId, setActiveChatId]);

  const handleSend = useCallback(async (): Promise<void> => {
    if (!input.trim() || isSending || !me) return;

    const val = input;
    const nowTime = Date.now();
    const tempId = `temp-${nowTime}`;

    setSentCache((prev) => {
      const next = [...prev, { time: nowTime, text: val, claimed: false }];
      return next.length > 50 ? next.slice(-50) : next;
    });

    const newMsg: Message = {
      id: tempId,
      chatId,
      text: val,
      sentAt: new Date(nowTime).toISOString(),
      isRead: false,
      isEdited: false,
      isEncrypted: false,
      sender: me,
    };

    setOptimisticMsgs((prev) => [...prev, newMsg]);
    resetInput();

    try {
      await sendMessage(val);
      setTimeout(() => {
        setOptimisticMsgs((prev) => prev.filter((m) => m.id !== tempId));
      }, 2000);
    } catch {
      setOptimisticMsgs((prev) => prev.filter((m) => m.id !== tempId));
      setInput(val);
    }
  }, [input, isSending, me, chatId, sendMessage, resetInput, setInput]);

  return (
    <div className="flex flex-col h-full bg-background w-full fixed inset-0 z-[60] md:relative md:z-auto overflow-hidden">
      <ChatHeader
        title={chat?.title}
        photoUrl={chat?.photoUrl}
        totalUnread={totalUnread}
        members={chat?.members}
        meId={me?.id}
      />

      <main className="flex-1 relative overflow-hidden bg-background">
        {isInitialLoading ? (
          <motion.div
            key="skeleton"
            variants={pageVariants}
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
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-12 w-[40%] rounded-2xl rounded-tr-none" />
            </div>
          </motion.div>
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

      <footer className="shrink-0">
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
