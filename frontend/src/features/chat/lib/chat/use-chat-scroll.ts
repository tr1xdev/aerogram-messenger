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
  isAtBottom: boolean;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

export function useChatScroll({
  messages,
  myId,
  onMarkRead,
}: UseChatScrollProps): ChatScrollResult {
  const scrollRef: RefObject<HTMLDivElement | null> =
    useRef<HTMLDivElement | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(true);

  const isPinnedToBottom: RefObject<boolean> = useRef<boolean>(true);
  const prevMessagesLength: RefObject<number> = useRef<number>(0);
  const prevScrollHeight: RefObject<number> = useRef<number>(0);
  const isInitialRender: RefObject<boolean> = useRef<boolean>(true);
  const currentChatId: RefObject<string | null> = useRef<string | null>(null);
  const onMarkReadRef: RefObject<() => void> = useRef<() => void>(onMarkRead);
  const lastScrollTime: RefObject<number> = useRef<number>(0);

  useLayoutEffect((): void => {
    onMarkReadRef.current = onMarkRead;
  }, [onMarkRead]);

  const getViewport = useCallback((): HTMLElement | null => {
    return (
      scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]") ??
      scrollRef.current
    );
  }, []);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth"): void => {
      const viewport: HTMLElement | null = getViewport();
      if (!viewport) return;

      isPinnedToBottom.current = true;
      setIsAtBottom(true);

      const now: number = Date.now();
      const finalBehavior: ScrollBehavior =
        now - lastScrollTime.current < 150 ? "auto" : behavior;
      lastScrollTime.current = now;

      requestAnimationFrame((): void => {
        setShowScrollBtn(false);
        if (unreadCount > 0) {
          setUnreadCount(0);
        }
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: finalBehavior,
        });
      });

      if (unreadCount > 0) {
        onMarkReadRef.current();
      }
    },
    [getViewport, unreadCount],
  );

  const handleScroll = useCallback((): void => {
    const viewport: HTMLElement | null = getViewport();
    if (!viewport) return;

    const {
      scrollTop,
      scrollHeight,
      clientHeight,
    }: { scrollTop: number; scrollHeight: number; clientHeight: number } =
      viewport;
    const distanceToBottom: number = scrollHeight - scrollTop - clientHeight;

    const isNearBottom: boolean = distanceToBottom <= 100;
    isPinnedToBottom.current = isNearBottom;
    setShowScrollBtn(!isNearBottom);
    setIsAtBottom(isNearBottom);

    if (isNearBottom && unreadCount > 0) {
      setUnreadCount(0);
      onMarkReadRef.current();
    }
  }, [getViewport, unreadCount]);

  useEffect((): (() => void) | void => {
    const viewport: HTMLElement | null = getViewport();
    if (!viewport) return;

    viewport.addEventListener("scroll", handleScroll, { passive: true });
    return (): void => viewport.removeEventListener("scroll", handleScroll);
  }, [handleScroll, getViewport]);

  useLayoutEffect((): void => {
    const firstMessageChatId: string | null =
      messages.length > 0 ? (messages[0].chatId ?? null) : null;

    if (currentChatId.current !== firstMessageChatId) {
      currentChatId.current = firstMessageChatId;
      isInitialRender.current = true;
      prevMessagesLength.current = 0;
      isPinnedToBottom.current = true;

      requestAnimationFrame((): void => {
        setIsAtBottom(true);
        setUnreadCount(0);
      });
    }

    const diff: number = messages.length - prevMessagesLength.current;
    const isNewMessage: boolean = diff > 0;
    const lastMsg: ScrollMessage | undefined = messages[messages.length - 1];
    const isMe: boolean = lastMsg?.sender?.id === myId;

    if (isInitialRender.current && messages.length > 0) {
      requestAnimationFrame((): void => scrollToBottom("auto"));
      isInitialRender.current = false;
    } else if (isNewMessage) {
      if (isMe || isPinnedToBottom.current) {
        const behavior: ScrollBehavior = diff > 1 ? "auto" : "smooth";
        requestAnimationFrame((): void => scrollToBottom(behavior));
      } else {
        setUnreadCount((prev: number): number => prev + diff);
      }
    }

    prevMessagesLength.current = messages.length;
  }, [messages, myId, scrollToBottom]);

  useLayoutEffect((): (() => void) | void => {
    const viewport: HTMLElement | null = getViewport();
    if (!viewport) return;

    const content: HTMLElement | null =
      viewport.firstElementChild as HTMLElement;
    if (!content) return;

    const resizeObserver: ResizeObserver = new ResizeObserver((): void => {
      if (isInitialRender.current) return;

      const currentScrollHeight: number = viewport.scrollHeight;
      const heightDiff: number = currentScrollHeight - prevScrollHeight.current;

      if (heightDiff > 0 && isPinnedToBottom.current) {
        viewport.scrollTo({
          top: currentScrollHeight,
          behavior: "auto",
        });
      }

      prevScrollHeight.current = currentScrollHeight;
    });

    resizeObserver.observe(content);
    return (): void => resizeObserver.disconnect();
  }, [getViewport]);

  return { scrollRef, showScrollBtn, unreadCount, isAtBottom, scrollToBottom };
}
