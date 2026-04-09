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

export const MessageList = memo(function MessageList({
  messages,
  myId,
  lastReadSequence,
  onMarkRead,
  onReply,
  onEdit,
}: MessageListProps): ReactNode {
  const { scrollRef, showScrollBtn, unreadCount, scrollToBottom } =
    useChatScroll({
      messages,
      myId,
      onMarkRead,
    });

  const groupedMessages = useMemo(() => {
    const groups: { date: string; items: Message[] }[] = [];
    messages.forEach((m) => {
      const dateKey = new Date(m.sentAt).toDateString();
      const lastGroup = groups[groups.length - 1];
      if (lastGroup?.date === dateKey) {
        lastGroup.items.push(m);
      } else {
        groups.push({ date: dateKey, items: [m] });
      }
    });
    return groups;
  }, [messages]);

  return (
    <div className="h-full w-full relative overflow-hidden bg-background">
      <ScrollArea ref={scrollRef} className="h-full w-full">
        <div className="px-4 py-6 w-full flex flex-col max-w-4xl mx-auto min-h-full justify-end">
          {groupedMessages.map((g) => (
            <div key={g.date} className="flex flex-col mb-6">
              <DateDivider date={g.items[0].sentAt} />
              <div className="flex flex-col">
                {g.items.map((m, index) => {
                  const prevMessage = g.items[index - 1];
                  const isFirstInGroup =
                    !prevMessage || prevMessage.sender.id !== m.sender.id;

                  return (
                    <div
                      key={
                        m.id.startsWith("temp-")
                          ? `temp-${m.sentAt}-${m.text.slice(0, 5)}`
                          : m.id
                      }
                      className={isFirstInGroup ? "mt-3 first:mt-0" : "mt-1"}
                    >
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
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-6 right-6 z-40"
          >
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full shadow-2xl border h-10 w-10 bg-background/95 backdrop-blur-sm"
              onClick={() => scrollToBottom("smooth")}
            >
              <ArrowDown className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[20px] bg-primary text-[10px] text-primary-foreground rounded-full flex items-center justify-center font-bold px-1 border-2 border-background">
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
