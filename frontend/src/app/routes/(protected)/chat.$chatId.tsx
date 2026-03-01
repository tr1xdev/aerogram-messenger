import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ArrowDown } from "lucide-react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useChatStore } from "@/store/chat";
import {
  useChatHistory,
  useChatActions,
  useMe,
  useChatDetails,
} from "@/features/chat/lib/use-messages";
import { useGlobalSubscriptions } from "@/features/chat/lib/use-global-subscription";
import {
  GET_MESSAGE_HISTORY,
  MARK_DIALOG_AS_READ,
} from "@/features/chat/api/chat.gql";
import { formatLastSeen } from "@/shared/lib/date";
import { cn } from "@/lib/utils";
import type { Message } from "@/entities/chat/model/types";
import { useChatScroll } from "@/features/chat/lib/use-chat-scroll";
import { MessageBubble } from "@/features/chat/ui/message-bubble";
import { MessageComposer } from "@/features/chat/ui/message-composer";
import { DateDivider } from "@/features/chat/ui/date-divider";

function ChatPage() {
  const { chatId } = Route.useParams();
  const navigate = useNavigate();
  const client = useApolloClient();
  const lastMarkedSeqRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [optimisticMsgs, setOptimisticMsgs] = useState<Message[]>([]);
  const [isScrolling, setIsScrolling] = useState(false);

  const { input, setInput, resetInput, setActiveChatId } = useChatStore();
  const { data: meData, loading: meLoading } = useMe();
  const { data: chatData, loading: chatLoading } = useChatDetails(chatId);
  const { data: messages = [] } = useChatHistory(chatId);
  const { sendMessage, isSending } = useChatActions(chatId);

  const me = meData?.me;
  const chat = chatData?.chat;
  const lastReadSequence = chat?.lastReadSequence;

  useGlobalSubscriptions(chatId, me?.id);
  const [markDialog] = useMutation(MARK_DIALOG_AS_READ);

  const allMessages = useMemo(() => {
    const combined = [...messages, ...optimisticMsgs];
    const map = new Map<string, Message>();
    combined.forEach((m) => map.set(m.id, m));
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
    );
  }, [messages, optimisticMsgs]);

  const handleScrollState = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 1500);
  }, []);

  const checkAndMarkRead = useCallback(() => {
    if (!me || !chatId || !allMessages.length) return;
    const partnerMsgs = allMessages.filter(
      (m) =>
        m.sender.id !== me.id &&
        !m.id.startsWith("temp-") &&
        typeof m.sequence === "number",
    );
    if (!partnerMsgs.length) return;
    const lastMsg = partnerMsgs[partnerMsgs.length - 1];
    const seq = lastMsg.sequence as number;

    if (lastReadSequence !== undefined && seq <= lastReadSequence) return;
    if (lastMarkedSeqRef.current === seq) return;

    lastMarkedSeqRef.current = seq;
    markDialog({
      variables: { chatID: chatId, lastSequence: seq },
      onCompleted: () => {
        const vars = { chatId, limit: 50, offset: 0 };
        const history = client.readQuery<{ messageHistory: Message[] }>({
          query: GET_MESSAGE_HISTORY,
          variables: vars,
        });
        if (history) {
          client.writeQuery({
            query: GET_MESSAGE_HISTORY,
            variables: vars,
            data: {
              messageHistory: history.messageHistory.map((m) =>
                m.sender.id !== me.id ? { ...m, isRead: true } : m,
              ),
            },
          });
        }
      },
    });
  }, [allMessages, me, chatId, markDialog, client, lastReadSequence]);

  const {
    scrollRef,
    showScrollBtn,
    unreadCount,
    scrollToBottom,
    isAtBottomRef,
  } = useChatScroll({
    messages: allMessages,
    myId: me?.id,
    onMarkRead: checkAndMarkRead,
  });

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (viewport) {
      viewport.addEventListener("scroll", handleScrollState);
    }
    return () => {
      viewport?.removeEventListener("scroll", handleScrollState);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [handleScrollState, scrollRef]);

  useEffect(() => {
    if (chatId) {
      setActiveChatId(chatId);
      setTimeout(() => scrollToBottom("instant"), 50);
    }
    return () => setActiveChatId(null);
  }, [chatId, setActiveChatId, scrollToBottom]);

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
    const currentInput = input;
    resetInput();
    isAtBottomRef.current = true;
    setTimeout(() => scrollToBottom("smooth"), 10);
    sendMessage(currentInput, {
      onCompleted: () =>
        setOptimisticMsgs((prev) => prev.filter((m) => m.id !== tempId)),
      onError: () => {
        setOptimisticMsgs((prev) => prev.filter((m) => m.id !== tempId));
        setInput(currentInput);
      },
    });
  };

  const otherUser = useMemo(
    () => chat?.members?.find((m) => m.id !== me?.id),
    [chat?.members, me?.id],
  );

  if (meLoading || (!chat && chatLoading)) {
    return (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden w-full max-w-full">
      <header className="flex h-14 items-center justify-between px-4 border-b shrink-0 bg-background/95 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/" })}
            className="md:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={chat?.photoUrl || ""} />
              <AvatarFallback>
                {chat?.title?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                {chat?.title || "Chat"}
              </span>
              {otherUser && (
                <span
                  className={cn(
                    "text-[10px]",
                    otherUser.status === "online"
                      ? "text-primary font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {formatLastSeen(otherUser.status)}
                </span>
              )}
            </div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 min-h-0 relative w-full overflow-hidden">
        <ScrollArea ref={scrollRef} className="h-full w-full">
          <div className="p-4 space-y-2 w-full max-w-full flex flex-col overflow-hidden">
            {allMessages.map((msg, index) => {
              const prevMsg = allMessages[index - 1];
              const currentDate = new Date(msg.sentAt).toDateString();
              const prevDate = prevMsg
                ? new Date(prevMsg.sentAt).toDateString()
                : null;
              const showDivider = currentDate !== prevDate;

              return (
                <div key={msg.id} className="w-full">
                  {showDivider && (
                    <DateDivider date={msg.sentAt} isScrolling={isScrolling} />
                  )}
                  <MessageBubble
                    message={msg}
                    isMe={msg.sender.id === me?.id}
                    isRead={
                      msg.sender.id === me?.id &&
                      !msg.id.startsWith("temp-") &&
                      typeof msg.sequence === "number" &&
                      lastReadSequence !== undefined &&
                      lastReadSequence >= (msg.sequence as number)
                    }
                  />
                </div>
              );
            })}
          </div>
        </ScrollArea>
        {(showScrollBtn || unreadCount > 0) && (
          <div className="absolute bottom-4 right-6 z-30">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full shadow-lg h-12 w-12 relative bg-background/80 backdrop-blur"
              onClick={() => scrollToBottom()}
            >
              <ArrowDown className="h-6 w-6 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold border-2 border-background shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      <MessageComposer
        input={input}
        setInput={setInput}
        onSend={handleSend}
        disabled={isSending}
      />
    </div>
  );
}

export const Route = createFileRoute("/(protected)/chat/$chatId")({
  component: ChatPage,
});
