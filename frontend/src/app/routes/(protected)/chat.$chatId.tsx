import {
  useRef,
  useLayoutEffect,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Send, ArrowDown, Clock } from "lucide-react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
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

function ChatPage() {
  const { chatId } = Route.useParams();
  const navigate = useNavigate();
  const client = useApolloClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef(true);
  const lastMarkedSeqRef = useRef<number | null>(null);

  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [optimisticMsgs, setOptimisticMsgs] = useState<Message[]>([]);

  const { input, setInput, resetInput, setActiveChatId } = useChatStore();
  const { data: meData, loading: meLoading } = useMe();
  const { data: chatData, loading: chatLoading } = useChatDetails(chatId);
  const { data: messages = [] } = useChatHistory(chatId);
  const { sendMessage, isSending } = useChatActions(chatId);

  const me = meData?.me;
  const chat = chatData?.chat;

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

  const prevMsgsLengthRef = useRef(allMessages.length);

  const getViewport = useCallback(
    () =>
      scrollRef.current?.querySelector<HTMLDivElement>(
        "[data-radix-scroll-area-viewport]",
      ),
    [],
  );

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const v = getViewport();
      if (v) v.scrollTo({ top: v.scrollHeight, behavior });
    },
    [getViewport],
  );

  const checkAndMarkRead = useCallback(() => {
    if (!me || !chatId || !allMessages.length || !isAtBottom.current) return;

    const unread = allMessages
      .filter(
        (m) =>
          m.sender.id !== me.id &&
          !m.id.startsWith("temp-") &&
          typeof m.sequence === "number",
      )
      .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

    if (!unread.length) return;

    const lastMsg = unread[unread.length - 1];
    const seq = lastMsg.sequence!;

    if (chat?.lastReadSequence !== undefined && seq <= chat.lastReadSequence)
      return;
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
  }, [allMessages, me, chatId, markDialog, client, chat]);

  useLayoutEffect(() => {
    if (isAtBottom.current && allMessages.length > prevMsgsLengthRef.current) {
      scrollToBottom("instant");
    }
  }, [allMessages.length, scrollToBottom]);

  useEffect(() => {
    if (allMessages.length > prevMsgsLengthRef.current) {
      const lastMsg = allMessages[allMessages.length - 1];
      if (!isAtBottom.current && lastMsg?.sender.id !== me?.id) {
        setTimeout(() => setUnreadCount((p) => p + 1), 0);
      }
      prevMsgsLengthRef.current = allMessages.length;
      checkAndMarkRead();
    }
  }, [allMessages, me?.id, checkAndMarkRead]);

  useEffect(() => {
    const v = getViewport();
    if (!v) return;
    const onScroll = () => {
      const isBottom = v.scrollHeight - v.scrollTop <= v.clientHeight + 100;
      if (isAtBottom.current !== isBottom) {
        isAtBottom.current = isBottom;
        setShowScrollBtn(!isBottom);
        if (isBottom) {
          setUnreadCount(0);
          checkAndMarkRead();
        }
      }
    };
    v.addEventListener("scroll", onScroll);
    return () => v.removeEventListener("scroll", onScroll);
  }, [getViewport, checkAndMarkRead]);

  useEffect(() => {
    if (chatId) setActiveChatId(chatId);
    return () => setActiveChatId(null);
  }, [chatId, setActiveChatId]);

  const handleSend = () => {
    if (!input.trim() || isSending || !me) return;
    const tempId = `temp-${Date.now()}`;
    setOptimisticMsgs((prev) => [
      ...prev,
      {
        id: tempId,
        chatId,
        text: input,
        sentAt: new Date().toISOString(),
        isRead: false,
        isEdited: false,
        sender: me,
      },
    ]);
    const currentInput = input;
    resetInput();
    isAtBottom.current = true;
    setTimeout(() => {
      scrollToBottom("smooth");
      setUnreadCount(0);
    }, 10);
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

  if (meLoading || (!chat && chatLoading))
    return (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
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

      <div className="flex-1 min-h-0 relative">
        <ScrollArea ref={scrollRef} className="h-full">
          <div className="p-4 space-y-4">
            {allMessages.map((msg) => {
              const isMe = msg.sender.id === me?.id;
              const isRead =
                isMe &&
                !msg.id.startsWith("temp-") &&
                typeof msg.sequence === "number" &&
                chat
                  ? chat.lastReadSequence >= msg.sequence
                  : false;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-full",
                    isMe ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "flex flex-col max-w-[75%]",
                      isMe ? "items-end" : "items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-2xl",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted rounded-tl-none",
                        msg.id.startsWith("temp-") && "opacity-70",
                      )}
                    >
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.sentAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isMe && (
                        <span
                          className={cn(
                            "text-[10px] font-medium",
                            isRead ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {msg.id.startsWith("temp-") ? (
                            <Clock className="h-2 w-2 inline mr-1" />
                          ) : isRead ? (
                            "Read"
                          ) : (
                            "Sent"
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        {showScrollBtn && (
          <div className="absolute bottom-4 right-4 z-30">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full shadow-md h-10 w-10 relative"
              onClick={() => scrollToBottom()}
            >
              <ArrowDown className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold border-2 border-background animate-pulse">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      <footer className="p-4 border-t bg-background">
        <form
          className="flex gap-2 max-w-4xl mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Input
            placeholder="Message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isSending || !input.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
}

export const Route = createFileRoute("/(protected)/chat/$chatId")({
  component: ChatPage,
});
