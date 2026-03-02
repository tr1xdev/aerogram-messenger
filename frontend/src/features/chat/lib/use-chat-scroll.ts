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

    const currentLen = messages.length;
    if (currentLen > prevMsgsLengthRef.current) {
      const lastMsg = messages[currentLen - 1];
      const isMyMsg = lastMsg?.sender.id === myId;

      if (isAtBottomRef.current || isMyMsg) {
        const behavior = isMyMsg ? "smooth" : "instant";
        requestAnimationFrame(() => {
          v.scrollTo({ top: v.scrollHeight, behavior });
        });
      } else if (lastMsg && !lastMsg.id.startsWith("temp-")) {
        requestAnimationFrame(() => {
          setUnreadCount((p) => p + 1);
        });
      }
    }
    prevMsgsLengthRef.current = currentLen;
  }, [messages, getViewport, myId]);

  useEffect(() => {
    const v = getViewport();
    if (!v) return;
    const onScroll = () => {
      const isBottom = v.scrollHeight - v.scrollTop <= v.clientHeight + 150;
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
