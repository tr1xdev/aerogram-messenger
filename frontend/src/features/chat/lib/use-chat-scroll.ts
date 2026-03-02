import { useEffect, useRef, useState, useCallback } from "react";
import type { Message } from "@/entities/chat/model/types";

interface UseChatScrollProps {
  messages: Message[];
  myId?: string;
  onMarkRead: () => void;
}

export function useChatScroll({
  messages,
  myId,
  onMarkRead,
}: UseChatScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isInitialLoad = useRef(true);
  const prevChatId = useRef<string | null>(null);

  const getViewport = () =>
    scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const viewport = getViewport();
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    }
  }, []);

  useEffect(() => {
    const viewport = getViewport();
    if (!viewport || messages.length === 0) return;

    const currentChatId = messages[0].chatId;

    if (prevChatId.current !== currentChatId) {
      isInitialLoad.current = true;
      prevChatId.current = currentChatId;
      requestAnimationFrame(() => setUnreadCount(0));
    }

    if (isInitialLoad.current) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "instant" });
      isInitialLoad.current = false;
      return;
    }

    const lastMsg = messages[messages.length - 1];
    const isMe = lastMsg.sender.id === myId;
    const isNearBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 150;

    if (isMe || isNearBottom) {
      scrollToBottom("smooth");
    } else {
      requestAnimationFrame(() => setUnreadCount((prev) => prev + 1));
    }
  }, [messages, myId, scrollToBottom]);

  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;

    const handleScroll = () => {
      const bottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <
        100;
      setShowScrollBtn(!bottom);
      if (bottom) {
        setUnreadCount(0);
        onMarkRead();
      }
    };

    viewport.addEventListener("scroll", handleScroll);
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, [onMarkRead]);

  return { scrollRef, showScrollBtn, unreadCount, scrollToBottom };
}
