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

  const [prevChatId, setPrevChatId] = useState<string | null>(null);

  const isInitialLoadRef = useRef<boolean>(true);
  const prevMessagesLengthRef = useRef<number>(0);
  const lastProcessedChatIdRef = useRef<string | null>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const isScrollingToBottom = useRef<boolean>(false);

  const currentChatId: string | null =
    messages.length > 0 ? messages[0].chatId : null;

  if (currentChatId !== prevChatId) {
    setPrevChatId(currentChatId);
    setShowScrollBtn(false);
    setUnreadCount(0);
  }

  const getViewport = useCallback((): HTMLElement | null => {
    return scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;
  }, []);

  const updateScrollButtonVisibility = useCallback((): void => {
    const viewport: HTMLElement | null = getViewport();
    if (!viewport) return;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const distanceToBottom: number = scrollHeight - scrollTop - clientHeight;

    const isAtBottom: boolean = distanceToBottom < 35;
    isNearBottomRef.current = distanceToBottom < 150;

    if (isScrollingToBottom.current && isAtBottom) {
      isScrollingToBottom.current = false;
    }

    if (!isScrollingToBottom.current) {
      const shouldShow: boolean = distanceToBottom > 250 || unreadCount > 0;
      setShowScrollBtn((prev: boolean): boolean => {
        if (prev !== shouldShow) return shouldShow;
        return prev;
      });
    }

    if (isAtBottom) {
      setUnreadCount(0);
      onMarkRead();
    }
  }, [getViewport, onMarkRead, unreadCount]);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth"): void => {
      const viewport: HTMLElement | null = getViewport();
      if (!viewport) return;

      if (behavior === "smooth") {
        isScrollingToBottom.current = true;
        setShowScrollBtn(false);
      }

      const performScroll = (): void => {
        if (!viewport) return;
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior,
        });
      };

      requestAnimationFrame((): void => {
        performScroll();
        if (behavior === "smooth") {
          setTimeout(performScroll, 50);
          setTimeout(performScroll, 150);
        }
      });
    },
    [getViewport],
  );

  useLayoutEffect((): void => {
    if (lastProcessedChatIdRef.current !== currentChatId) {
      lastProcessedChatIdRef.current = currentChatId;
      isInitialLoadRef.current = true;
      prevMessagesLengthRef.current = 0;
    }

    if (isInitialLoadRef.current && messages.length > 0) {
      isInitialLoadRef.current = false;
      isNearBottomRef.current = true;
      prevMessagesLengthRef.current = messages.length;

      const viewport: HTMLElement | null = getViewport();
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, currentChatId, getViewport]);

  useEffect((): (() => void) | void => {
    const viewport: HTMLElement | null = getViewport();
    if (!viewport) return;

    const content: HTMLElement | null =
      viewport.firstElementChild as HTMLElement;
    if (!content) return;

    const resizeObserver: ResizeObserver = new ResizeObserver((): void => {
      if (
        isInitialLoadRef.current ||
        lastProcessedChatIdRef.current !== currentChatId
      ) {
        return;
      }

      const isNewMessage: boolean =
        messages.length > prevMessagesLengthRef.current;

      if (isNewMessage) {
        const lastMsg: Message | undefined = messages[messages.length - 1];
        if (!lastMsg) return;

        const isMe: boolean = lastMsg.sender.id === myId;

        if (isMe || isNearBottomRef.current) {
          setShowScrollBtn(false);
          scrollToBottom("smooth");
          if (isNearBottomRef.current) {
            onMarkRead();
          }
        } else {
          setUnreadCount((prev: number): number => prev + 1);
          setShowScrollBtn(true);
        }
      } else if (isNearBottomRef.current && !isScrollingToBottom.current) {
        const viewportNow: HTMLElement | null = getViewport();
        if (viewportNow) {
          viewportNow.scrollTo({
            top: viewportNow.scrollHeight,
            behavior: "auto",
          });
        }
      }

      prevMessagesLengthRef.current = messages.length;
    });

    resizeObserver.observe(content);
    return (): void => resizeObserver.disconnect();
  }, [messages, currentChatId, myId, scrollToBottom, getViewport, onMarkRead]);

  useEffect((): (() => void) => {
    const viewport: HTMLElement | null = getViewport();
    if (!viewport) return (): void => {};

    viewport.addEventListener("scroll", updateScrollButtonVisibility, {
      passive: true,
    });
    return (): void =>
      viewport.removeEventListener("scroll", updateScrollButtonVisibility);
  }, [updateScrollButtonVisibility, getViewport]);

  return { scrollRef, showScrollBtn, unreadCount, scrollToBottom };
}
