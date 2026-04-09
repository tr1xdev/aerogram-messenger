import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
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

  const isNearBottomRef = useRef(true);
  const prevMessagesLengthRef = useRef(messages.length);
  const onMarkReadRef = useRef(onMarkRead);

  useLayoutEffect(() => {
    onMarkReadRef.current = onMarkRead;
  }, [onMarkRead]);

  const getViewport = useCallback(() => {
    return scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;
  }, []);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const viewport = getViewport();
      if (!viewport) return;
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior,
      });
    },
    [getViewport],
  );

  const handleScroll = useCallback(() => {
    const viewport = getViewport();
    if (!viewport) return;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distanceToBottom < 30;

    isNearBottomRef.current = distanceToBottom < 150;

    if (atBottom) {
      requestAnimationFrame(() => {
        setUnreadCount(0);
        onMarkReadRef.current();
      });
    }

    setShowScrollBtn(distanceToBottom > 350 || unreadCount > 0);
  }, [getViewport, unreadCount]);

  useLayoutEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;

    const isNewMessage = messages.length > prevMessagesLengthRef.current;
    const lastMessage = messages[messages.length - 1];
    const isMyMessage = lastMessage?.sender.id === myId;

    if (prevMessagesLengthRef.current === 0 && messages.length > 0) {
      viewport.scrollTop = viewport.scrollHeight;
    } else if (isNewMessage) {
      if (isMyMessage || isNearBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom("smooth"));
      } else {
        requestAnimationFrame(() => {
          setUnreadCount((prev) => prev + 1);
        });
      }
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, myId, scrollToBottom, getViewport]);

  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;

    viewport.addEventListener("scroll", handleScroll, { passive: true });
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, [getViewport, handleScroll]);

  return { scrollRef, showScrollBtn, unreadCount, scrollToBottom };
}
