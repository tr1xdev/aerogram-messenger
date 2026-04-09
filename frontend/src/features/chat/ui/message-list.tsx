import { useMemo, memo, type ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageBubble } from "./message-bubble";
import { DateDivider } from "./date-divider";
import type { Message, ChatMember } from "@/entities/chat/model/types";
import { useChatScroll } from "../lib/chat/use-chat-scroll";

interface MessageListProps {
  chatId: string;
  messages: Message[];
  members?: ChatMember[];
  myId?: string;
  lastReadSequence?: number;
  onMarkRead: () => void;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
}

interface GroupedMessages {
  date: string;
  items: Message[];
}

export const MessageList = memo(function MessageList({
  messages,
  myId,
  lastReadSequence,
  onMarkRead,
  onReply,
  onEdit,
}: MessageListProps): ReactNode {
  const groupedMessages = useMemo((): GroupedMessages[] => {
    const groups: GroupedMessages[] = [];
    messages.forEach((m: Message) => {
      const dateKey: string = new Date(m.sentAt).toDateString();
      const lastGroup: GroupedMessages | undefined = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === dateKey) {
        lastGroup.items.push(m);
      } else {
        groups.push({ date: dateKey, items: [m] });
      }
    });
    return groups;
  }, [messages]);

  const { scrollRef, showScrollBtn, unreadCount, scrollToBottom } =
    useChatScroll({ messages, myId, onMarkRead });

  return (
    <div className="h-full w-full relative bg-transparent overflow-hidden">
      <ScrollArea ref={scrollRef} className="h-full w-full">
        <div className="px-4 py-6 w-full flex flex-col max-w-4xl mx-auto min-h-full">
          {groupedMessages.map((g: GroupedMessages) => (
            <div key={g.date} className="flex flex-col mb-6">
              <DateDivider date={g.items[0].sentAt} />
              <div className="flex flex-col space-y-1">
                {/* Убрали AnimatePresence и motion.div с анимацией появления/layout.
                  Теперь список ведет себя как стандартный HTML-список,
                  а плавность обеспечивает useChatScroll.
                */}
                {g.items.map((m: Message) => {
                  const isTemp = m.id.startsWith("temp-");
                  const key = isTemp
                    ? `temp-${m.sentAt}-${m.text.slice(0, 10)}`
                    : m.id;

                  return (
                    <div key={key}>
                      <MessageBubble
                        message={m}
                        myId={myId ?? ""}
                        lastReadSequence={lastReadSequence}
                        isMe={m.sender.id === myId}
                        isRead={m.isRead}
                        onReply={onReply}
                        onEdit={onEdit}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <AnimatePresence>
        {showScrollBtn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-6 right-6 z-40"
          >
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full shadow-xl bg-background/95 border h-10 w-10 active:scale-90 transition-all"
              onClick={(): void => scrollToBottom("smooth")}
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
});
