import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  type RefObject,
} from "react";

interface ScrollMessage {
  readonly id: string;
  readonly chatId?: string;
  readonly sender?: {
    readonly id: string;
  } | null;
}

interface UseChatScrollProps {
  messages: ReadonlyArray<ScrollMessage>;
  myId: string | undefined;
  onMarkRead: () => void;
}

interface ChatScrollResult {
  scrollRef: RefObject<HTMLDivElement | null>;
  showScrollBtn: boolean;
  unreadCount: number;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

export function useChatScroll({
  messages,
  myId,
  onMarkRead,
}: UseChatScrollProps): ChatScrollResult {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const isInitialLoad = useRef<boolean>(true);
  const prevChatId = useRef<string | null>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const prevMessagesLength = useRef<number>(0);
  const isScrollingToBottom = useRef<boolean>(false);
  const onMarkReadRef = useRef<() => void>(onMarkRead);

  useLayoutEffect((): void => {
    onMarkReadRef.current = onMarkRead;
  }, [onMarkRead]);

  const getViewport = useCallback((): HTMLElement | null => {
    return (
      scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]") ??
      null
    );
  }, []);

  const updateScrollButtonVisibility = useCallback((): void => {
    const viewport: HTMLElement | null = getViewport();
    if (!viewport) return;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const distanceToBottom: number = scrollHeight - scrollTop - clientHeight;

    const isAtBottom: boolean = distanceToBottom < 30;
    isNearBottomRef.current = distanceToBottom < 150;

    if (isScrollingToBottom.current && isAtBottom) {
      isScrollingToBottom.current = false;
    }

    if (!isScrollingToBottom.current) {
      setShowScrollBtn(!isAtBottom || unreadCount > 0);
    }

    if (isAtBottom) {
      if (unreadCount > 0) {
        requestAnimationFrame((): void => setUnreadCount(0));
      }
      onMarkReadRef.current();
    }
  }, [getViewport, unreadCount]);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth"): void => {
      const viewport: HTMLElement | null = getViewport();
      if (!viewport) return;

      if (behavior === "smooth") {
        isScrollingToBottom.current = true;
      }

      requestAnimationFrame((): void => {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior,
        });
      });
    },
    [getViewport],
  );

  useLayoutEffect((): void => {
    const currentChatId: string | null =
      messages.length > 0 ? (messages[0].chatId ?? null) : null;

    if (currentChatId && prevChatId.current !== currentChatId) {
      prevChatId.current = currentChatId;
      isInitialLoad.current = true;
      prevMessagesLength.current = 0;
    }

    if (isInitialLoad.current && messages.length > 0) {
      const viewport: HTMLElement | null = getViewport();
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
        isInitialLoad.current = false;
        isNearBottomRef.current = true;
        prevMessagesLength.current = messages.length;
        requestAnimationFrame((): void => setUnreadCount(0));
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

      const lastMsg: ScrollMessage | undefined = messages[messages.length - 1];
      if (!lastMsg) return;

      const isNewMessage: boolean =
        messages.length > prevMessagesLength.current;
      const isMe: boolean = lastMsg.sender?.id === myId;

      if (isNewMessage) {
        if (isMe || isNearBottomRef.current) {
          scrollToBottom("smooth");
        } else {
          requestAnimationFrame((): void => {
            setUnreadCount((prev: number): number => prev + 1);
          });
        }
      }

      prevMessagesLength.current = messages.length;
    });

    resizeObserver.observe(content);
    return (): void => resizeObserver.disconnect();
  }, [messages, myId, scrollToBottom, getViewport]);

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
