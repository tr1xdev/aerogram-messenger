import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";

interface ScrollMessage {
  readonly id: string;
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
  scrollRef: React.RefObject<HTMLDivElement | null>;
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

  const isNearBottomRef = useRef<boolean>(true);
  const prevMessagesLengthRef = useRef<number>(messages.length);
  const onMarkReadRef = useRef<() => void>(onMarkRead);

  useLayoutEffect((): void => {
    onMarkReadRef.current = onMarkRead;
  }, [onMarkRead]);

  const getViewport = useCallback((): HTMLElement | null => {
    const el: HTMLDivElement | null = scrollRef.current;
    if (!el) return null;
    return el.querySelector(
      "[data-radix-scroll-area-viewport]",
    ) as HTMLElement | null;
  }, []);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth"): void => {
      const viewport: HTMLElement | null = getViewport();
      if (!viewport) return;
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior,
      });
    },
    [getViewport],
  );

  const handleScroll = useCallback((): void => {
    const viewport: HTMLElement | null = getViewport();
    if (!viewport) return;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const distanceToBottom: number = scrollHeight - scrollTop - clientHeight;
    const atBottom: boolean = distanceToBottom < 30;

    isNearBottomRef.current = distanceToBottom < 150;

    if (atBottom) {
      requestAnimationFrame((): void => {
        setUnreadCount(0);
        onMarkReadRef.current();
      });
    }

    setShowScrollBtn(distanceToBottom > 350 || unreadCount > 0);
  }, [getViewport, unreadCount]);

  useLayoutEffect((): void => {
    const viewport: HTMLElement | null = getViewport();
    if (!viewport) return;

    const isNewMessage: boolean =
      messages.length > prevMessagesLengthRef.current;
    const lastMessage: ScrollMessage | undefined =
      messages[messages.length - 1];
    const isMyMessage: boolean = lastMessage?.sender?.id === myId;

    if (prevMessagesLengthRef.current === 0 && messages.length > 0) {
      viewport.scrollTop = viewport.scrollHeight;
    } else if (isNewMessage) {
      if (isMyMessage || isNearBottomRef.current) {
        requestAnimationFrame((): void => scrollToBottom("smooth"));
      } else {
        requestAnimationFrame((): void => {
          setUnreadCount((prev: number): number => prev + 1);
        });
      }
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, myId, scrollToBottom, getViewport]);

  useEffect((): (() => void) => {
    const viewport: HTMLElement | null = getViewport();
    if (!viewport) return (): void => {};

    viewport.addEventListener("scroll", handleScroll, { passive: true });
    return (): void => viewport.removeEventListener("scroll", handleScroll);
  }, [getViewport, handleScroll]);

  return { scrollRef, showScrollBtn, unreadCount, scrollToBottom };
}
