import { useMemo, useState, useEffect, useRef, memo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageBubble } from "./message-bubble";
import { DateDivider } from "./date-divider";
import type { Message, ChatMember } from "@/entities/chat/model/types";
import { useChatScroll } from "../lib/use-chat-scroll";
import { useChatActions } from "../lib/use-messages";

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
  chatId,
  messages,
  members,
  myId,
  lastReadSequence,
  onMarkRead,
  onReply,
  onEdit,
}: MessageListProps) {
  const { decryptMessage } = useChatActions(chatId);
  const [decryptedMap, setDecryptedMap] = useState<Record<string, string>>({});
  const mapRef = useRef<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    const fetchDecrypted = async () => {
      let hasChanges = false;
      const newEntries: Record<string, string> = {};

      for (const m of messages) {
        if (
          m.replyTo &&
          m.replyTo.isEncrypted &&
          !mapRef.current[m.replyTo.id]
        ) {
          try {
            const txt = await decryptMessage(m.replyTo);
            newEntries[m.replyTo.id] = txt;
            mapRef.current[m.replyTo.id] = txt;
            hasChanges = true;
          } catch {
            // ...
          }
        }
      }

      if (isMounted && hasChanges) {
        setDecryptedMap((prev) => ({ ...prev, ...newEntries }));
      }
    };

    fetchDecrypted();

    return () => {
      isMounted = false;
    };
  }, [messages, decryptMessage]);

  const processedMessages = useMemo(() => {
    return messages.map((m) => {
      if (m.replyTo && decryptedMap[m.replyTo.id]) {
        return {
          ...m,
          replyTo: {
            ...m.replyTo,
            text: decryptedMap[m.replyTo.id],
            isEncrypted: false,
          },
        };
      }
      return m;
    });
  }, [messages, decryptedMap]);

  const groupedMessages = useMemo(() => {
    const groups: { date: string; items: Message[] }[] = [];
    processedMessages.forEach((msg) => {
      const d = new Date(msg.sentAt).toDateString();
      const g = groups.find((it) => it.date === d);
      if (g) g.items.push(msg);
      else groups.push({ date: d, items: [msg] });
    });
    return groups;
  }, [processedMessages]);

  const peerPublicKey = useMemo(() => {
    return members?.find((m) => m.user.id !== myId)?.user.publicKey;
  }, [members, myId]);

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
                    myId={myId ?? ""}
                    peerPublicKey={peerPublicKey}
                    isMe={m.sender.id === myId}
                    isRead={
                      m.sender.id === myId &&
                      !m.id.startsWith("temp-") &&
                      m.sequence !== undefined &&
                      lastReadSequence !== undefined &&
                      lastReadSequence >= m.sequence
                    }
                    onReply={onReply}
                    onEdit={onEdit}
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
});
