import {
  useMemo,
  useState,
  useEffect,
  useRef,
  memo,
  type ReactNode,
} from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageBubble } from "./message-bubble";
import { DateDivider } from "./date-divider";
import type { Message, ChatMember } from "@/entities/chat/model/types";
import { useChatScroll } from "../lib/chat/use-chat-scroll";
import { useMessageActions } from "../lib";

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
  chatId,
  messages,
  members,
  myId,
  lastReadSequence,
  onMarkRead,
  onReply,
  onEdit,
}: MessageListProps): ReactNode {
  const { decryptMessage } = useMessageActions(chatId);
  const [decryptedMap, setDecryptedMap] = useState<Record<string, string>>({});
  const mapRef = useRef<Record<string, string>>({});
  const lastProcessedLength = useRef<number>(0);

  useEffect((): void | (() => void) => {
    let isMounted = true;

    const fetchNewDecrypted = async (): Promise<void> => {
      const newEntries: Record<string, string> = {};
      let hasChanges = false;

      const messagesToProcess =
        messages.length > lastProcessedLength.current + 10
          ? messages.slice(-10)
          : messages;

      for (const m of messagesToProcess) {
        const reply = m.replyTo;
        if (reply?.isEncrypted && !mapRef.current[reply.id]) {
          try {
            const txt = await decryptMessage(reply);
            newEntries[reply.id] = txt;
            mapRef.current[reply.id] = txt;
            hasChanges = true;
          } catch {
            /* ignore decryption errors */
          }
        }
      }

      if (isMounted && hasChanges) {
        setDecryptedMap((prev) => ({ ...prev, ...newEntries }));
      }
      lastProcessedLength.current = messages.length;
    };

    fetchNewDecrypted();
    return () => {
      isMounted = false;
    };
  }, [messages, decryptMessage]);

  const groupedMessages = useMemo((): GroupedMessages[] => {
    const groups: GroupedMessages[] = [];

    messages.forEach((m) => {
      let processedMsg = m;
      if (m.replyTo && decryptedMap[m.replyTo.id]) {
        processedMsg = {
          ...m,
          replyTo: {
            ...m.replyTo,
            text: decryptedMap[m.replyTo.id],
            isEncrypted: false,
          },
        };
      }

      const dateKey = new Date(processedMsg.sentAt).toDateString();
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.date === dateKey) {
        lastGroup.items.push(processedMsg);
      } else {
        groups.push({ date: dateKey, items: [processedMsg] });
      }
    });

    return groups;
  }, [messages, decryptedMap]);

  const peerPublicKey = useMemo(
    () => members?.find((m) => m.user.id !== myId)?.user.publicKey,
    [members, myId],
  );

  const { scrollRef, showScrollBtn, unreadCount, scrollToBottom } =
    useChatScroll({ messages, myId, onMarkRead });

  return (
    <div className="h-full w-full relative bg-transparent overflow-hidden">
      <ScrollArea ref={scrollRef} className="h-full w-full">
        <div className="px-4 py-6 w-full flex flex-col max-w-4xl mx-auto min-h-full">
          {groupedMessages.map((g) => (
            <div key={g.date} className="flex flex-col mb-6">
              <DateDivider date={g.items[0].sentAt} />
              <div className="flex flex-col space-y-1">
                {g.items.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={m.isSending ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <MessageBubble
                      message={m}
                      myId={myId ?? ""}
                      lastReadSequence={lastReadSequence}
                      peerPublicKey={peerPublicKey}
                      isMe={m.sender.id === myId}
                      isRead={m.isRead}
                      onReply={onReply}
                      onEdit={onEdit}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <AnimatePresence>
        {showScrollBtn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-6 right-6 z-40"
          >
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full shadow-xl bg-background/95 border h-10 w-10 active:scale-90 transition-all"
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
