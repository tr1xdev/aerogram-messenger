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
import {
  GET_MESSAGE_HISTORY,
  MARK_DIALOG_AS_READ,
  GET_MY_CHATS,
} from "@/features/chat/api/chat.gql";
import { formatLastSeen } from "@/shared/lib/date";
import { cn } from "@/lib/utils";
import type { Message, Chat } from "@/entities/chat/model/types";
import { useChatScroll } from "@/features/chat/lib/use-chat-scroll";
import { MessageBubble } from "@/features/chat/ui/message-bubble";
import { MessageComposer } from "@/features/chat/ui/message-composer";
import { DateDivider } from "@/features/chat/ui/date-divider";

interface MessageGroup {
  date: string;
  items: Message[];
}

function ChatPage() {
  const { chatId } = Route.useParams();
  const navigate = useNavigate();
  const client = useApolloClient();
  const lastMarkedSeqRef = useRef<number | null>(null);

  const [tick, setTick] = useState(0);
  const [optimisticMsgs, setOptimisticMsgs] = useState<Message[]>([]);

  const { input, setInput, resetInput, setActiveChatId } = useChatStore();
  const { data: meData, loading: meLoading } = useMe();
  const { data: chatData, loading: chatLoading } = useChatDetails(chatId);
  const { data: messages = [] } = useChatHistory(chatId);
  const { sendMessage, isSending } = useChatActions(chatId);

  const me = meData?.me;
  const chat = chatData?.chat;
  const lastReadSequence = chat?.lastReadSequence;

  const [markDialog] = useMutation(MARK_DIALOG_AS_READ);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const allMessages = useMemo(() => {
    const map = new Map<string, Message>();
    messages.forEach((m) => map.set(m.id, m));
    optimisticMsgs.forEach((om) => {
      const isAlreadyInHistory = messages.some(
        (m) =>
          m.text === om.text &&
          Math.abs(
            new Date(m.sentAt).getTime() - new Date(om.sentAt).getTime(),
          ) < 5000,
      );
      if (!isAlreadyInHistory) map.set(om.id, om);
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
    );
  }, [messages, optimisticMsgs]);

  const groupedMessages = useMemo(() => {
    const groups: MessageGroup[] = [];
    allMessages.forEach((msg) => {
      const dateKey = new Date(msg.sentAt).toDateString();
      const existingGroup = groups.find((g) => g.date === dateKey);
      if (existingGroup) {
        existingGroup.items.push(msg);
      } else {
        groups.push({ date: dateKey, items: [msg] });
      }
    });
    return groups;
  }, [allMessages]);

  const checkAndMarkRead = useCallback(() => {
    if (document.visibilityState !== "visible") return;
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
        client.cache.modify({
          id: client.cache.identify({ __typename: "Chat", id: chatId }),
          fields: {
            unreadCount: () => 0,
            lastReadSequence: (prev: number) => Math.max(prev || 0, seq),
          },
        });

        const sidebar = client.readQuery<{ myChats: Chat[] }>({
          query: GET_MY_CHATS,
        });
        if (sidebar) {
          client.writeQuery({
            query: GET_MY_CHATS,
            data: {
              myChats: sidebar.myChats.map((c) =>
                c.id === chatId
                  ? {
                      ...c,
                      unreadCount: 0,
                      lastReadSequence: Math.max(c.lastReadSequence || 0, seq),
                    }
                  : c,
              ),
            },
          });
        }

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

  const { scrollRef, showScrollBtn, unreadCount, scrollToBottom } =
    useChatScroll({
      messages: allMessages,
      myId: me?.id,
      onMarkRead: checkAndMarkRead,
    });

  useEffect(() => {
    lastMarkedSeqRef.current = null;
    if (chatId) {
      setActiveChatId(chatId);
      setTimeout(() => scrollToBottom("instant"), 50);
    }
    return () => setActiveChatId(null);
  }, [chatId, setActiveChatId, scrollToBottom]);

  useEffect(() => {
    if (allMessages.length > 0 && me) {
      checkAndMarkRead();
    }
  }, [allMessages.length, me?.id, checkAndMarkRead]);

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
    sendMessage(currentInput, {
      onCompleted: () =>
        setOptimisticMsgs((prev) => prev.filter((m) => m.id !== tempId)),
      onError: () => {
        setOptimisticMsgs((prev) => prev.filter((m) => m.id !== tempId));
        setInput(currentInput);
      },
    });
  };

  const otherMember = useMemo(
    () => chat?.members?.find((m) => m.user.id !== me?.id),
    [chat?.members, me?.id, tick],
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
      <header className="flex h-14 items-center justify-between px-4 border-b shrink-0 bg-background/95 backdrop-blur z-50">
        <div className="flex items-center gap-3 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/" })}
            className="md:hidden shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 text-left overflow-hidden">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={chat?.photoUrl || ""} />
              <AvatarFallback className="text-xs">
                {chat?.title?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col justify-center overflow-hidden py-0.5">
              <span className="text-[14px] font-semibold text-foreground truncate leading-tight max-w-[150px] md:max-w-[250px]">
                {chat?.title || "Chat"}
              </span>
              {chat?.type === "PRIVATE" && otherMember && (
                <span
                  key={`status-${tick}`}
                  className={cn(
                    "text-[11px] truncate leading-tight transition-colors duration-300 mt-0.5",
                    otherMember.user.status === "online"
                      ? "text-sky-500 dark:text-sky-400 font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {formatLastSeen(otherMember.user.status)}
                </span>
              )}
            </div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 min-h-0 relative w-full overflow-hidden">
        <ScrollArea ref={scrollRef} className="h-full w-full">
          <div className="px-4 py-2 w-full max-w-full flex flex-col">
            {groupedMessages.map((group) => (
              <div key={group.date} className="flex flex-col w-full">
                <DateDivider date={group.items[0].sentAt} />
                <div className="flex flex-col space-y-1">
                  {group.items.map((msg) => (
                    <MessageBubble
                      key={msg.id}
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {(showScrollBtn || unreadCount > 0) && (
          <div className="absolute bottom-4 right-6 z-40">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full shadow-lg h-10 w-10 relative bg-background/80 backdrop-blur"
              onClick={() => scrollToBottom()}
            >
              <ArrowDown className="h-5 w-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground font-bold border-2 border-background shadow-sm">
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

export const Route = createFileRoute("/(protected)/_layout/chat/$chatId")({
  component: ChatPage,
});
