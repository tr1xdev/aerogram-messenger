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
import { useApolloClient } from "@apollo/client/react";
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
  GET_MY_CHATS,
} from "@/features/chat/api/chat.gql";
import { formatLastSeen } from "@/shared/lib/date";
import { cn } from "@/lib/utils";
import type { Message, User, Chat } from "@/entities/chat/model/types";

function ChatPage() {
  const { chatId } = Route.useParams();
  const navigate = useNavigate();
  const client = useApolloClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottom = useRef<boolean>(true);
  const lastMarkedIdRef = useRef<string | null>(null);

  const [showScrollBtn, setShowScrollBtn] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [optimisticMsgs, setOptimisticMsgs] = useState<Message[]>([]);

  const { input, setInput, resetInput, setActiveChatId } = useChatStore();

  const { data: meData, loading: meLoading } = useMe();
  const { data: chatData, loading: chatLoading } = useChatDetails(chatId);
  const { data: messages = [] } = useChatHistory(chatId);
  const { sendMessage, isSending, markAsRead } = useChatActions(chatId);

  const me = meData?.me;
  const chat = chatData?.chat;

  useGlobalSubscriptions(chatId, me?.id);

  const allMessages = useMemo(() => {
    const combined = [...messages, ...optimisticMsgs];
    const unique = Array.from(new Map(combined.map((m) => [m.id, m])).values());
    return unique.sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
    );
  }, [messages, optimisticMsgs]);

  useEffect(() => {
    if (chatId) {
      setActiveChatId(chatId);
    }
    return () => setActiveChatId(null);
  }, [chatId, setActiveChatId]);

  useEffect(() => {
    if (chatId) {
      const sidebarData = client.readQuery<{ myChats: Chat[] }>({
        query: GET_MY_CHATS,
      });
      if (sidebarData) {
        const updated = sidebarData.myChats.map((c: Chat) =>
          c.id === chatId ? { ...c, unreadCount: 0 } : c,
        );
        client.writeQuery({ query: GET_MY_CHATS, data: { myChats: updated } });
      }
    }
  }, [chatId, client]);

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

  useEffect(() => {
    const v = getViewport();
    if (!v) return;
    const onScroll = () => {
      const bottom = v.scrollHeight - v.scrollTop <= v.clientHeight + 100;
      isAtBottom.current = bottom;
      setShowScrollBtn(!bottom);
      if (bottom) setUnreadCount(0);
    };
    v.addEventListener("scroll", onScroll);
    return () => v.removeEventListener("scroll", onScroll);
  }, [getViewport]);

  useEffect(() => {
    if (!allMessages.length || !me?.id || !isAtBottom.current) return;

    const unreadFromOthers = allMessages.filter(
      (m) => m.sender.id !== me.id && !m.isRead && !m.id.startsWith("temp-"),
    );

    if (unreadFromOthers.length > 0) {
      const lastUnread = unreadFromOthers[unreadFromOthers.length - 1];
      if (lastMarkedIdRef.current !== lastUnread.id) {
        lastMarkedIdRef.current = lastUnread.id;
        markAsRead(lastUnread.id);
      }
    }
  }, [allMessages, me?.id, markAsRead]);

  useLayoutEffect(() => {
    if (isAtBottom.current) scrollToBottom("instant");
  }, [allMessages.length, scrollToBottom]);

  if (meLoading || (!chat && chatLoading)) {
    return (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  const handleSend = () => {
    if (!input.trim() || isSending || !me) return;

    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      chatId,
      text: input,
      sentAt: new Date().toISOString(),
      isRead: false,
      isEdited: false,
      sender: me,
    };

    setOptimisticMsgs((prev) => [...prev, tempMsg]);
    const currentInput = input;
    resetInput();
    isAtBottom.current = true;
    setTimeout(() => scrollToBottom("smooth"), 10);

    sendMessage(currentInput, {
      onCompleted: (result) => {
        const newRealMsg = result.sendMessage;
        const historyVars = { chatId, limit: 50, offset: 0 };
        const existing = client.readQuery<{ messageHistory: Message[] }>({
          query: GET_MESSAGE_HISTORY,
          variables: historyVars,
        });

        if (existing) {
          client.writeQuery({
            query: GET_MESSAGE_HISTORY,
            variables: historyVars,
            data: {
              messageHistory: [...existing.messageHistory, newRealMsg],
            },
          });
        }
        setOptimisticMsgs((prev) => prev.filter((m) => m.id !== tempId));
      },
      onError: () => {
        setOptimisticMsgs((prev) => prev.filter((m) => m.id !== tempId));
        setInput(currentInput);
      },
    });
  };

  const otherUser =
    chat?.type === "PRIVATE"
      ? chat.members?.find((m: User) => m.id !== me?.id)
      : null;

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
            {allMessages.map((msg: Message) => {
              const isMe = msg.sender.id === me?.id;
              const isTemp = msg.id.startsWith("temp-");
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
                        isTemp && "opacity-70",
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
                            msg.isRead
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        >
                          {isTemp ? (
                            <Clock className="h-2 w-2 inline mr-1" />
                          ) : msg.isRead ? (
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
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-4 right-4 rounded-full shadow-lg"
            onClick={() => scrollToBottom()}
          >
            <ArrowDown className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-[10px] rounded-full h-4 w-4 flex items-center justify-center text-white font-bold">
                {unreadCount}
              </span>
            )}
          </Button>
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
