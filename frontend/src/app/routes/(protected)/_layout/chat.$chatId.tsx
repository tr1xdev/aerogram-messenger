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

const MATCH_THRESHOLD_MS: number = 5000;

const log = {
  info: (msg: string, data?: unknown): void => {
    console.log(
      "%c info %c " + msg,
      "background: #3b82f6; color: white; border-radius: 4px; padding: 2px 6px; font-weight: bold;",
      "color: #3b82f6; font-weight: 500;",
      data ?? "",
    );
  },
  error: (msg: string, err: unknown): void => {
    console.log(
      "%c error %c " + msg,
      "background: #ef4444; color: white; border-radius: 4px; padding: 2px 6px; font-weight: bold;",
      "color: #ef4444;",
      err,
    );
  },
};

export const Route = createFileRoute("/(protected)/_layout/chat/$chatId")({
  component: ChatRoute,
});

function ChatRoute() {
  const { chatId } = Route.useParams();
  return <ChatPage key={chatId} chatId={chatId} />;
}

export function ChatPage({ chatId }: { chatId: string }) {
  const navigate = useNavigate();
  const [optimisticMsgs, setOptimisticMsgs] = useState<Message[]>([]);
  const [sentCache, setSentCache] = useState<SentCacheEntry[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [decryptedReplyText, setDecryptedReplyText] = useState<string>("");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

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

  const {
    messages: messagesFromHistory,
    isLoading: historyLoading,
    lastReadSequence,
  } = useChatHistory(chatId);

  const { sendMessage, editMessage, decryptMessage, isSending } =
    useChatActions(chatId);
  const { data: chatsData } = useMyChats();

  const isInitialLoading: boolean = !chat && chatLoading;
  const isNotFound: boolean =
    (!chat && !chatLoading && !!chatError) ||
    (!chat && !chatLoading && !!chatData);

  useEffect((): (() => void) => {
    setActiveChatId(chatId);
    log.info(`Switched context to chat: ${chatId}`);
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

  const totalUnread = useMemo((): number => {
    const chats: Chat[] = chatsData?.myChats?.chats || [];
    return chats.reduce((acc: number, c: Chat): number => {
      return c.id === chatId ? acc : acc + (c.unreadCount ?? 0);
    }, 0);
  }, [chatsData, chatId]);

  const allMessages = useMemo((): Message[] => {
    if (!me || !chatId) return messagesFromHistory;

    const serverIds: Set<string> = new Set<string>(
      messagesFromHistory.map((m: Message): string => m.id),
    );
    const usedCacheIds: Set<string> = new Set<string>();

    const patchedServerMessages: Message[] = messagesFromHistory.map(
      (m: Message): Message => {
        if (m.sender.id === me.id && m.isEncrypted) {
          const msgTime: number = new Date(m.sentAt).getTime();
          const match: SentCacheEntry | undefined = sentCache.find(
            (c: SentCacheEntry): boolean =>
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
        return !messagesFromHistory.some(
          (m: Message): boolean =>
            m.sender.id === me.id &&
            Math.abs(new Date(m.sentAt).getTime() - omTime) < 2000,
        );
      },
    );

    const combined: Message[] = [
      ...patchedServerMessages,
      ...filteredOptimistic,
    ].sort((a: Message, b: Message): number => {
      const timeA: number = new Date(a.sentAt).getTime();
      const timeB: number = new Date(b.sentAt).getTime();
      if (Math.abs(timeA - timeB) > 2000) return timeA - timeB;
      if (a.sequence !== undefined && b.sequence !== undefined) {
        return a.sequence - b.sequence;
      }
      return timeA - timeB;
    });

    return combined;
  }, [messagesFromHistory, optimisticMsgs, me, sentCache, chatId]);

  const { checkAndMarkRead } = useMarkDialog(
    chatId,
    allMessages,
    me,
    lastReadSequence ?? 0,
  );

  useEffect((): void => {
    if (allMessages.length > 0) {
      checkAndMarkRead();
    }
  }, [allMessages.length, checkAndMarkRead]);

  const handleSend = useCallback(async (): Promise<void> => {
    const currentInput: string = inputRef.current.trim();
    if (!currentInput || isSending || !me) return;

    if (editingMessage) {
      try {
        log.info(`Editing message: ${editingMessage.id}`);
        await editMessage(editingMessage.id, currentInput);
        cancelAction();
      } catch (err: unknown) {
        log.error("Failed to edit message", err);
      }
      return;
    }

    const val: string = currentInput;
    const nowTime: number = Date.now();
    const tempId: string = crypto.randomUUID();
    const currentReplyId: string | undefined = replyingTo?.id ?? undefined;

    setSentCache((prev: SentCacheEntry[]): SentCacheEntry[] => {
      const next: SentCacheEntry[] = [
        ...prev,
        { id: tempId, time: nowTime, text: val },
      ];
      return next.length > 50 ? next.slice(-50) : next;
    });

    const newMsg: Message = {
      id: tempId,
      chatId: chatId,
      text: val,
      sentAt: new Date(nowTime).toISOString(),
      isRead: false,
      isEdited: false,
      isEncrypted: false,
      sender: me,
      replyTo: replyingTo || undefined,
    };

    log.info(`Sending message (optimistic): ${tempId}`);
    setOptimisticMsgs((prev: Message[]): Message[] => [...prev, newMsg]);
    cancelAction();

    try {
      await sendMessage(val, { variables: { replyToId: currentReplyId } });
    } catch (err: unknown) {
      log.error("Send failed, rolling back", err);
      setInput(val);
      setSentCache((prev: SentCacheEntry[]): SentCacheEntry[] =>
        prev.filter((c: SentCacheEntry): boolean => c.id !== tempId),
      );
    } finally {
      setOptimisticMsgs((prev: Message[]): Message[] =>
        prev.filter((m: Message): boolean => m.id !== tempId),
      );
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

  const replyPreview: Message | null = useMemo((): Message | null => {
    if (!replyingTo) return null;
    return { ...replyingTo, text: decryptedReplyText };
  }, [replyingTo, decryptedReplyText]);

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
    <div className="flex flex-col h-[100dvh] bg-background w-full fixed inset-0 z-[60] md:relative md:z-auto overflow-hidden">
      <ChatHeader
        title={chat?.title ?? undefined}
        photoUrl={chat?.photoUrl ?? undefined}
        totalUnread={totalUnread}
        members={chat?.members}
        meId={me?.id}
        isLoading={isInitialLoading}
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
        ) : allMessages.length === 0 && !historyLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm">No messages yet.</p>
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
          input={input}
          setInput={setInput}
          onSend={handleSend}
          disabled={isSending}
          replyingTo={replyPreview}
          editingMessage={editingMessage}
          onCancelAction={cancelAction}
        />
      )}
    </div>
  );
}
