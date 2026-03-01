import {
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  useEffect,
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
  const isAtBottomRef = useRef(true);
  const prevMsgsLengthRef = useRef(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const getViewport = useCallback(
    () =>
      scrollRef.current?.querySelector<HTMLDivElement>(
        "[data-radix-scroll-area-viewport]",
      ),
    [],
  );

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const v = getViewport();
      if (v) {
        v.scrollTo({ top: v.scrollHeight, behavior });
        isAtBottomRef.current = true;
        setShowScrollBtn(false);
        setUnreadCount(0);
      }
    },
    [getViewport],
  );

  useLayoutEffect(() => {
    const v = getViewport();
    if (!v) return;

    if (messages.length > prevMsgsLengthRef.current) {
      if (isAtBottomRef.current) {
        v.scrollTo({ top: v.scrollHeight, behavior: "instant" });
      } else {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.sender.id !== myId && !lastMsg?.id.startsWith("temp-")) {
          setTimeout(() => setUnreadCount((p) => p + 1), 0);
        }
      }
    }
    prevMsgsLengthRef.current = messages.length;
  }, [messages.length, getViewport, myId]);

  useEffect(() => {
    const v = getViewport();
    if (!v) return;
    const onScroll = () => {
      const isBottom = v.scrollHeight - v.scrollTop <= v.clientHeight + 100;
      isAtBottomRef.current = isBottom;
      setShowScrollBtn(!isBottom);
      if (isBottom) {
        setUnreadCount(0);
        onMarkRead();
      }
    };
    v.addEventListener("scroll", onScroll);
    return () => v.removeEventListener("scroll", onScroll);
  }, [getViewport, onMarkRead]);

  return {
    scrollRef,
    showScrollBtn,
    unreadCount,
    scrollToBottom,
    isAtBottomRef,
  };
}
