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
  const [showScrollBtn, setShowScrollBtn] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const isInitialLoad = useRef<boolean>(true);
  const prevChatId = useRef<string | null>(null);
  const lastMsgId = useRef<string | null>(null);
  const isNearBottomRef = useRef<boolean>(true);

  const getViewport = useCallback((): HTMLElement | null => {
    if (!scrollRef.current) return null;
    return scrollRef.current.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;
  }, []);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth"): void => {
      const viewport: HTMLElement | null = getViewport();
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior });
      }
    },
    [getViewport],
  );

  useLayoutEffect((): void => {
    const currentChatId: string | null =
      messages.length > 0 ? messages[0].chatId : null;
    if (!currentChatId) return;

    if (prevChatId.current !== currentChatId) {
      prevChatId.current = currentChatId;
      isInitialLoad.current = true;
      lastMsgId.current = null;
    }

    if (isInitialLoad.current && messages.length > 0) {
      const viewport: HTMLElement | null = getViewport();
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: "instant" });
        isInitialLoad.current = false;
        isNearBottomRef.current = true;
        Promise.resolve().then((): void => setUnreadCount(0));
      }
    }
  }, [messages, getViewport]);

  useEffect((): (() => void) | void => {
    const viewport: HTMLElement | null = getViewport();
    if (!viewport) return;

    const content: HTMLElement | null =
      viewport.firstElementChild as HTMLElement;
    if (!content) return;

    const resizeObserver: ResizeObserver = new ResizeObserver((): void => {
      if (isInitialLoad.current) return;

      const lastMsg: Message = messages[messages.length - 1];
      if (!lastMsg) return;

      const isMe: boolean = lastMsg.sender.id === myId;

      if (isMe || isNearBottomRef.current) {
        scrollToBottom("smooth");
        if (lastMsg.id !== lastMsgId.current) {
          lastMsgId.current = lastMsg.id;
        }
      } else if (lastMsg.id !== lastMsgId.current) {
        lastMsgId.current = lastMsg.id;
        Promise.resolve().then((): void => {
          setUnreadCount((prev: number): number => prev + 1);
        });
      }
    });

    resizeObserver.observe(content);
    return (): void => resizeObserver.disconnect();
  }, [messages, myId, scrollToBottom, getViewport]);

  useEffect((): (() => void) => {
    const viewport: HTMLElement | null = getViewport();
    if (!viewport) return (): void => {};

    const handleScroll = (): void => {
      const distance: number =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      const isAtBottom: boolean = distance < 100;

      isNearBottomRef.current = distance < 400;
      setShowScrollBtn(!isAtBottom);

      if (isAtBottom) {
        Promise.resolve().then((): void => setUnreadCount(0));
        onMarkRead();
      }
    };

    viewport.addEventListener("scroll", handleScroll);
    return (): void => viewport.removeEventListener("scroll", handleScroll);
  }, [onMarkRead, getViewport]);

  return { scrollRef, showScrollBtn, unreadCount, scrollToBottom };
}
