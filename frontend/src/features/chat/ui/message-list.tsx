import {
  useMemo,
  memo,
  type ReactNode,
  type ReactElement,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./message-bubble";
import { DateDivider } from "./date-divider";
import { useChatScroll } from "../lib/chat/use-chat-scroll";
import type { Message, ChatMember } from "@/entities/chat/model/types";

interface MessageListProps {
  chatId: string;
  messages: readonly Message[];
  members?: readonly ChatMember[];
  myId?: string;
  chatType?: "PRIVATE" | "GROUP" | "CHANNEL";
  lastReadSequence?: number;
  canWrite?: boolean;
  onMarkRead: () => void;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (id: string) => void;
  onForward: (message: Message) => void;
  onScrollAtBottomChange: (atBottom: boolean) => void;
}

interface MessageDateGroup {
  date: string;
  items: Message[];
}

export const MessageList = memo(function MessageList({
  messages,
  myId,
  chatType = "GROUP",
  lastReadSequence,
  canWrite = true,
  onMarkRead,
  onReply,
  onEdit,
  onDelete,
  onForward,
  onScrollAtBottomChange,
}: MessageListProps): ReactNode {
  const groupedMessages: MessageDateGroup[] =
    useMemo((): MessageDateGroup[] => {
      const groups: MessageDateGroup[] = [];
      messages.forEach((m: Message): void => {
        if (!m) return;
        const dateKey: string = new Date(m.sentAt).toDateString();
        const lastGroup: MessageDateGroup | undefined =
          groups[groups.length - 1];

        if (lastGroup?.date === dateKey) {
          lastGroup.items.push(m);
        } else {
          groups.push({ date: dateKey, items: [m] });
        }
      });
      return groups;
    }, [messages]);

  const { scrollRef, showScrollBtn, unreadCount, isAtBottom, scrollToBottom } =
    useChatScroll({
      messages,
      myId,
      onMarkRead,
    });

  useEffect((): void => {
    onScrollAtBottomChange(isAtBottom);
  }, [isAtBottom, onScrollAtBottomChange]);

  return (
    <div className="h-full w-full relative bg-transparent overflow-hidden">
      <ScrollArea ref={scrollRef} type="auto" className="h-full w-full">
        <div
          className="px-2 sm:px-4 py-6 mx-auto min-h-full flex flex-col w-full max-w-4xl"
          style={{ overflowAnchor: "none" }}
        >
          {groupedMessages.map(
            (g: MessageDateGroup): ReactElement => (
              <div key={g.date} className="flex flex-col mb-6 w-full">
                <DateDivider date={g.items[0].sentAt} />
                <div className="flex flex-col space-y-0.5 w-full">
                  {g.items.map((m: Message, index: number): ReactElement => {
                    const prevMessage: Message | undefined = g.items[index - 1];
                    const nextMessage: Message | undefined = g.items[index + 1];

                    const isFirstInGroup: boolean =
                      !prevMessage || prevMessage.sender?.id !== m.sender?.id;
                    const isLastInGroup: boolean =
                      !nextMessage || nextMessage.sender?.id !== m.sender?.id;

                    const animationKey: string = m.id.startsWith("temp-")
                      ? `${m.id}-${m.sentAt}`
                      : m.id;

                    return (
                      <motion.div
                        key={animationKey}
                        layout="position"
                        initial={
                          m.id.startsWith("temp-")
                            ? { opacity: 0, y: 10 }
                            : false
                        }
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.15,
                          ease: "easeOut",
                        }}
                        className={cn(
                          "w-full flex flex-col",
                          isFirstInGroup ? "mt-3 first:mt-0" : "",
                        )}
                      >
                        <MessageBubble
                          message={m}
                          myId={myId ?? ""}
                          chatType={chatType}
                          lastReadSequence={lastReadSequence}
                          canWrite={canWrite}
                          isMe={m.sender?.id === myId}
                          isFirstInGroup={isFirstInGroup}
                          isLastInGroup={isLastInGroup}
                          onReply={onReply}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onForward={onForward}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ),
          )}
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
              className="rounded-full shadow-xl bg-background/95 border h-10 w-10 active:scale-95 transition-transform"
              onClick={(): void => scrollToBottom("smooth")}
            >
              <ArrowDown className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[20px] bg-primary text-[10px] text-primary-foreground rounded-full flex items-center justify-center font-bold border-2 border-background px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
