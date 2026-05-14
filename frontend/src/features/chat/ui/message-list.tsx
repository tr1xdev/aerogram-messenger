import { useMemo, memo, type ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFragment, graphql } from "react-relay";
import { MessageBubble } from "./message-bubble/index";
import { DateDivider } from "./date-divider";
import { useChatScroll } from "../lib/chat/use-chat-scroll";

import type { messageList_message$key } from "./__generated__/messageList_message.graphql";
import type { messageList_prevMessage$key } from "./__generated__/messageList_prevMessage.graphql";
import type { messageList_nextMessage$key } from "./__generated__/messageList_nextMessage.graphql";
import type {
  messageList_metadata$key,
  messageList_metadata$data,
} from "./__generated__/messageList_metadata.graphql";
import type { messageBubble_message$data } from "./__generated__/messageBubble_message.graphql";

interface MessageListProps {
  chatId: string;
  messages: messageList_metadata$key;
  myId?: string;
  chatType?: "PRIVATE" | "GROUP" | "CHANNEL";
  lastReadSequence?: number;
  canWrite?: boolean;
  onMarkRead: () => void;
  onReply: (message: messageBubble_message$data) => void;
  onEdit: (message: messageBubble_message$data) => void;
  onDelete: (id: string) => void;
  onForward: (message: messageBubble_message$data) => void;
  onScrollAtBottomChange: (atBottom: boolean) => void;
}

type MessageItemData = messageList_metadata$data[number];

const MessageItem = memo(
  ({
    messageKey,
    prevMessageKey,
    nextMessageKey,
    myId,
    chatType,
    lastReadSequence,
    canWrite,
    onReply,
    onEdit,
    onDelete,
    onForward,
  }: {
    messageKey: messageList_message$key;
    prevMessageKey: messageList_prevMessage$key | null;
    nextMessageKey: messageList_nextMessage$key | null;
    myId: string;
    chatType: "PRIVATE" | "GROUP" | "CHANNEL";
    lastReadSequence?: number;
    canWrite: boolean;
    onReply: (message: messageBubble_message$data) => void;
    onEdit: (message: messageBubble_message$data) => void;
    onDelete: (id: string) => void;
    onForward: (message: messageBubble_message$data) => void;
  }) => {
    const data = useFragment(
      graphql`
        fragment messageList_message on Message {
          id
          sentAt
          sender {
            id
          }
          ...messageBubble_message
        }
      `,
      messageKey,
    );

    const prevData = useFragment(
      graphql`
        fragment messageList_prevMessage on Message {
          sender {
            id
          }
        }
      `,
      prevMessageKey,
    );

    const nextData = useFragment(
      graphql`
        fragment messageList_nextMessage on Message {
          sender {
            id
          }
        }
      `,
      nextMessageKey,
    );

    const isFirstInGroup: boolean =
      !prevData || prevData.sender?.id !== data.sender?.id;
    const isLastInGroup: boolean =
      !nextData || nextData.sender?.id !== data.sender?.id;

    return (
      <motion.div
        layout="position"
        layoutId={
          data.id.startsWith("temp-") ? `${data.id}-${data.sentAt}` : data.id
        }
        initial={data.id.startsWith("temp-") ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          "w-full flex flex-col min-w-0",
          isFirstInGroup ? "mt-3 first:mt-0" : "",
        )}
      >
        <MessageBubble
          message={data}
          myId={myId}
          chatType={chatType}
          lastReadSequence={lastReadSequence}
          canWrite={canWrite}
          isMe={data.sender?.id === myId}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          onForward={onForward}
        />
      </motion.div>
    );
  },
);

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
  const messageData = useFragment<messageList_metadata$key>(
    graphql`
      fragment messageList_metadata on Message @relay(plural: true) {
        id
        sentAt
        sender {
          id
        }
        ...messageList_message
        ...messageList_prevMessage
        ...messageList_nextMessage
      }
    `,
    messages,
  );

  const groupedMessages = useMemo(() => {
    const groups: { date: string; items: MessageItemData[] }[] = [];
    messageData.forEach((data: MessageItemData) => {
      const dateKey: string = new Date(data.sentAt).toDateString();
      const lastGroup = groups[groups.length - 1];
      if (lastGroup?.date === dateKey) {
        lastGroup.items = [...lastGroup.items, data];
      } else {
        groups.push({ date: dateKey, items: [data] });
      }
    });
    return groups;
  }, [messageData]);

  const { scrollRef, showScrollBtn, unreadCount, isAtBottom, scrollToBottom } =
    useChatScroll({
      messages: messageData,
      myId,
      onMarkRead,
    });

  useEffect((): void => {
    onScrollAtBottomChange(isAtBottom);
  }, [isAtBottom, onScrollAtBottomChange]);

  return (
    <div className="h-full w-full relative bg-transparent overflow-hidden isolate flex flex-col">
      <ScrollArea ref={scrollRef} type="auto" className="flex-1 w-full min-h-0">
        <div
          className="px-2 sm:px-4 py-6 mx-auto min-h-full flex flex-col w-full max-w-4xl min-w-0"
          style={{
            overflowAnchor: "none",
            contain: "inline-size",
          }}
        >
          {groupedMessages.map(
            (g: { date: string; items: MessageItemData[] }) => (
              <div key={g.date} className="flex flex-col mb-6 w-full min-w-0">
                <div className="mb-4">
                  <DateDivider date={g.items[0].sentAt} />
                </div>
                <div className="flex flex-col space-y-0.5 w-full min-w-0">
                  {g.items.map((m: MessageItemData, index: number) => (
                    <MessageItem
                      key={m.id}
                      messageKey={m as unknown as messageList_message$key}
                      prevMessageKey={
                        (g.items[
                          index - 1
                        ] as unknown as messageList_prevMessage$key) ?? null
                      }
                      nextMessageKey={
                        (g.items[
                          index + 1
                        ] as unknown as messageList_nextMessage$key) ?? null
                      }
                      myId={myId ?? ""}
                      chatType={chatType}
                      lastReadSequence={lastReadSequence}
                      canWrite={canWrite}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onForward={onForward}
                    />
                  ))}
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
