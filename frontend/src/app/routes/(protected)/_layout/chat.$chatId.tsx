import { useMemo, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence, type Variants } from "framer-motion";
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
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

function ChatPage() {
  const { chatId } = Route.useParams();
  const [optimisticMsgs, setOptimisticMsgs] = useState<Message[]>([]);
  const { input, setInput, resetInput, setActiveChatId } = useChatStore();

  const { data: meData } = useMe();
  const { data: chatData, loading: chatLoading } = useChatDetails(chatId);
  const { data: messages = [] } = useChatHistory(chatId);
  const { sendMessage, isSending } = useChatActions(chatId);
  const { data: chatsData } = useMyChats();

  const me = meData?.me;
  const chat = chatData?.chat;

  const isInitialLoading = !chat && chatLoading;

  const totalUnread = useMemo(() => {
    return (chatsData?.myChats ?? []).reduce((acc: number, c: Chat) => {
      return c.id === chatId ? acc : acc + (c.unreadCount ?? 0);
    }, 0);
  }, [chatsData?.myChats, chatId]);

  const allMessages = useMemo(() => {
    const map = new Map<string, Message>();
    messages.forEach((m) => map.set(m.id, m));
    optimisticMsgs.forEach((om) => {
      const exists = messages.some(
        (m) =>
          m.text === om.text &&
          Math.abs(
            new Date(m.sentAt).getTime() - new Date(om.sentAt).getTime(),
          ) < 2000,
      );
      if (!exists) map.set(om.id, om);
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
    );
  }, [messages, optimisticMsgs]);

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

  const handleSend = () => {
    if (!input.trim() || isSending || !me) return;
    const tempId = `temp-${Date.now()}`;
    const newMsg: Message = {
      id: tempId,
      chatId,
      text: input,
      sentAt: new Date().toISOString(),
      isRead: false,
      isEdited: false,
      sender: me,
    };
    setOptimisticMsgs((prev) => [...prev, newMsg]);
    const val = input;
    resetInput();
    sendMessage(val, {
      onCompleted: () =>
        setOptimisticMsgs((prev) => prev.filter((m) => m.id !== tempId)),
      onError: () => {
        setOptimisticMsgs((prev) => prev.filter((m) => m.id !== tempId));
        setInput(val);
      },
    });
  };

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
        <AnimatePresence mode="popLayout" initial={false}>
          {isInitialLoading ? (
            <motion.div
              key="skeleton"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 p-6 flex flex-col gap-6"
            >
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-10 w-[60%] rounded-2xl rounded-tr-none" />
                <Skeleton className="h-8 w-[40%] rounded-2xl rounded-tr-none opacity-60" />
              </div>
              <div className="flex flex-col items-start gap-2">
                <Skeleton className="h-10 w-[55%] rounded-2xl rounded-tl-none opacity-40" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-12 w-[30%] rounded-2xl rounded-tr-none opacity-20" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              className="h-full w-full"
            >
              <MessageList
                messages={allMessages}
                myId={me?.id}
                lastReadSequence={chat?.lastReadSequence}
                onMarkRead={checkAndMarkRead}
              />
            </motion.div>
          )}
        </AnimatePresence>
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

export const Route = createFileRoute("/(protected)/_layout/chat/$chatId")({
  component: ChatPage,
});
