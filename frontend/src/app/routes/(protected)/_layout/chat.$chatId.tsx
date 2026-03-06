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

function ChatPage({ chatId }: { chatId: string }) {
  const [optimisticMsgs, setOptimisticMsgs] = useState<Message[]>([]);
  const [sentCache, setSentCache] = useState<SentCacheEntry[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [decryptedReplyText, setDecryptedReplyText] = useState<string>("");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  const { input, setInput, resetInput, setActiveChatId } = useChatStore();
  const inputRef = useRef<string>(input);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const { data: meData } = useMe();
  const { data: chatData, loading: chatLoading } = useChatDetails(chatId);
  const { data: messages = [] } = useChatHistory(chatId);
  const { sendMessage, editMessage, decryptMessage, isSending } =
    useChatActions(chatId);
  const { data: chatsData } = useMyChats();

  const me: User | undefined = meData?.me;
  const chat: Chat | undefined = chatData?.chat;
  const isInitialLoading = !chat && chatLoading;

  useGlobalSubscriptions(chatId, me?.id);

  useEffect(() => {
    setActiveChatId(chatId);
    return () => setActiveChatId(null);
  }, [chatId, setActiveChatId]);

  useEffect(() => {
    if (replyingTo) {
      decryptMessage(replyingTo).then(setDecryptedReplyText);
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

  const totalUnread = useMemo((): number => {
    const myChats: Chat[] = chatsData?.myChats ?? [];
    return myChats.reduce((acc: number, c: Chat) => {
      return c.id === chatId ? acc : acc + (c.unreadCount ?? 0);
    }, 0);
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
      const hasArrivedOnServer = messages.some(
        (m) =>
          m.sender.id === me.id &&
          Math.abs(new Date(m.sentAt).getTime() - omTime) < 2000,
      );
      return !hasArrivedOnServer;
    });

    return [...patchedServerMessages, ...filteredOptimistic].sort(
      (a: Message, b: Message) => {
        const timeA = new Date(a.sentAt).getTime();
        const timeB = new Date(b.sentAt).getTime();
        if (Math.abs(timeA - timeB) > 2000) return timeA - timeB;
        if (a.sequence !== undefined && b.sequence !== undefined) {
          return a.sequence - b.sequence;
        }
        return timeA - timeB;
      },
    );
  }, [messages, optimisticMsgs, me, sentCache]);

  const { checkAndMarkRead } = useMarkDialog(
    chatId,
    allMessages,
    me,
    chat?.lastReadSequence,
  );

  const handleMarkRead = useCallback((): void => {
    checkAndMarkRead();
  }, [checkAndMarkRead]);

  useEffect(() => {
    checkAndMarkRead();
  }, [allMessages, checkAndMarkRead]);

  const handleSend = useCallback(async (): Promise<void> => {
    const currentInput = inputRef.current.trim();
    if (!currentInput || isSending || !me) return;

    if (editingMessage) {
      try {
        await editMessage(editingMessage.id, currentInput);
        cancelAction();
      } catch (err) {
        console.error(err);
      }
      return;
    }

    const val = currentInput;
    const nowTime = Date.now();
    const tempId = crypto.randomUUID();
    const currentReplyId = replyingTo?.id;

    setSentCache((prev) => {
      const next = [...prev, { id: tempId, time: nowTime, text: val }];
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
      sequence: 0,
      replyTo: replyingTo || undefined,
    };

    setOptimisticMsgs((prev) => [...prev, newMsg]);
    cancelAction();

    try {
      await sendMessage(val, { variables: { replyToId: currentReplyId } });
    } catch (error: unknown) {
      setInput(val);
      setSentCache((prev) => prev.filter((c) => c.id !== tempId));
      console.error(error);
    } finally {
      setOptimisticMsgs((prev) => prev.filter((m) => m.id !== tempId));
    }
  }, [
    chatId,
    isSending,
    me,
    sendMessage,
    editMessage,
    editingMessage,
    replyingTo,
    cancelAction,
    setInput,
  ]);

  const replyPreview = useMemo(() => {
    if (!replyingTo) return null;
    return { ...replyingTo, text: decryptedReplyText };
  }, [replyingTo, decryptedReplyText]);

  return (
    <div className="flex flex-col h-[100dvh] bg-background w-full md:relative overflow-hidden">
      <ChatHeader
        title={chat?.title}
        photoUrl={chat?.photoUrl}
        totalUnread={totalUnread}
        members={chat?.members}
        meId={me?.id}
      />

      <main className="flex-1 relative min-h-0 bg-background">
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
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs">Type a message to start the conversation.</p>
          </div>
        ) : (
          <MessageList
            chatId={chatId}
            messages={allMessages}
            members={chat?.members}
            myId={me?.id}
            lastReadSequence={chat?.lastReadSequence}
            onMarkRead={handleMarkRead}
            onReply={handleReplyInitiate}
            onEdit={handleEditInitiate}
          />
        )}
      </main>

      <MessageComposer
        input={input}
        setInput={setInput}
        onSend={handleSend}
        disabled={isSending}
        replyingTo={replyPreview}
        editingMessage={editingMessage}
        onCancelAction={cancelAction}
      />
    </div>
  );
}
