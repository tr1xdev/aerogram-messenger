import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageBubble } from "./message-bubble";
import { DateDivider } from "./date-divider";
import type { Message } from "@/entities/chat/model/types";
import { useChatScroll } from "../lib/use-chat-scroll";

interface MessageListProps {
  messages: Message[];
  myId?: string;
  lastReadSequence?: number;
  onMarkRead: () => void;
}

export function MessageList({
  messages,
  myId,
  lastReadSequence,
  onMarkRead,
}: MessageListProps) {
  const groupedMessages = useMemo(() => {
    const groups: { date: string; items: Message[] }[] = [];
    messages.forEach((msg) => {
      const d = new Date(msg.sentAt).toDateString();
      const g = groups.find((it) => it.date === d);
      if (g) g.items.push(msg);
      else groups.push({ date: d, items: [msg] });
    });
    return groups;
  }, [messages]);

  const { scrollRef, showScrollBtn, unreadCount, scrollToBottom } =
    useChatScroll({
      messages,
      myId,
      onMarkRead,
    });

  return (
    <div className="h-full w-full relative">
      <ScrollArea ref={scrollRef} className="h-full w-full">
        <div className="px-4 py-6 w-full flex flex-col max-w-4xl mx-auto">
          {groupedMessages.map((g) => (
            <div key={g.date} className="flex flex-col mb-6">
              <DateDivider date={g.items[0].sentAt} />
              <div className="flex flex-col space-y-1">
                {g.items.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isMe={m.sender.id === myId}
                    isRead={
                      m.sender.id === myId &&
                      !m.id.startsWith("temp-") &&
                      m.sequence !== undefined &&
                      lastReadSequence !== undefined &&
                      lastReadSequence >= m.sequence
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <AnimatePresence>
        {showScrollBtn && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-6 right-6 z-40"
          >
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full shadow-lg bg-background/95 hover:bg-background border h-10 w-10"
              onClick={() => scrollToBottom("smooth")}
            >
              <ArrowDown className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[20px] bg-primary text-[10px] text-primary-foreground rounded-full flex items-center justify-center font-bold border-2 border-background px-1">
                  {unreadCount}
                </span>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
