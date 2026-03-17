import { useState, useEffect, useMemo, memo } from "react";
import {
  Clock,
  Check,
  CheckCheck,
  Copy,
  Forward,
  Reply,
  Pencil,
  Trash2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { decryptText, getPrivateKey } from "@/shared/lib/crypto";
import type { Message } from "@/entities/chat/model/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { MessageInfoDialog } from "./message-info-dialog";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  myId: string;
  isRead?: boolean;
  lastReadSequence?: number;
  peerPublicKey?: string;
  onDelete?: (id: string) => void;
  onEdit?: (message: Message) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
}

interface HighlightEvent extends Event {
  detail?: { id: string };
}

const isLikelyEncrypted = (str: string): boolean => {
  if (!str || str.includes(" ") || str.length < 12) return false;
  const base64Regex: RegExp = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(str)) return false;
  try {
    const decoded: string = atob(str);
    return decoded.length >= 8;
  } catch {
    return false;
  }
};

export const MessageBubble = memo(function MessageBubble({
  message,
  isMe,
  myId,
  isRead,
  lastReadSequence,
  peerPublicKey,
  onDelete,
  onEdit,
  onReply,
  onForward,
}: MessageBubbleProps) {
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [decryptedReplyText, setDecryptedReplyText] = useState<string | null>(
    null,
  );
  const [isHighlighted, setIsHighlighted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);

  const isTemp: boolean =
    message.id.startsWith("temp-") || message.id.length < 10;

  const isActuallyRead: boolean = useMemo((): boolean => {
    if (isRead || message.isRead) return true;
    if (message.sequence === undefined || lastReadSequence === undefined)
      return false;
    return message.sequence <= lastReadSequence;
  }, [isRead, message.isRead, message.sequence, lastReadSequence]);

  useEffect(() => {
    let isMounted: boolean = true;

    const decrypt = async (
      text: string,
      iv: string,
      isMsgMe: boolean,
      senderPub?: string,
    ): Promise<string | null> => {
      try {
        if (!isLikelyEncrypted(text)) return text;
        const privKeyObj = await getPrivateKey(myId);
        const pubKey: string | undefined = isMsgMe ? peerPublicKey : senderPub;
        if (!privKeyObj || !pubKey || !iv) return null;
        return await decryptText(text, iv, pubKey, privKeyObj);
      } catch {
        return null;
      }
    };

    const processAll = async (): Promise<void> => {
      if (message.isEncrypted && message.encryptionIv) {
        const res: string | null = await decrypt(
          message.text,
          message.encryptionIv,
          isMe,
          message.sender?.publicKey,
        );
        if (isMounted) {
          setDecryptedText(res);
          if (!res) setError("Decryption error");
        }
      }

      if (message.replyTo?.isEncrypted && message.replyTo.encryptionIv) {
        const isReplyMe: boolean = message.replyTo.sender.id === myId;
        const res: string | null = await decrypt(
          message.replyTo.text,
          message.replyTo.encryptionIv,
          isReplyMe,
          message.replyTo.sender.publicKey,
        );
        if (isMounted) setDecryptedReplyText(res);
      }
    };

    processAll();
    return (): void => {
      isMounted = false;
    };
  }, [message, myId, isMe, peerPublicKey]);

  const handleScrollToReply = (): void => {
    if (!message.replyTo) return;
    const targetId: string = `msg-${message.replyTo.id}`;
    const element: HTMLElement | null = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      const highlightEvent: CustomEvent = new CustomEvent("highlight-message", {
        detail: { id: message.replyTo.id },
      });
      window.dispatchEvent(highlightEvent);
    }
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let observer: IntersectionObserver | null = null;

    const handleHighlight = (e: Event): void => {
      const event: HighlightEvent = e as HighlightEvent;
      if (event.detail?.id === message.id) {
        const element: HTMLElement | null = document.getElementById(
          `msg-${message.id}`,
        );
        if (!element) return;
        if (observer) observer.disconnect();
        observer = new IntersectionObserver(
          (entries: IntersectionObserverEntry[]): void => {
            if (entries[0].isIntersecting) {
              setTimeout((): void => {
                setIsHighlighted(true);
                timeoutId = setTimeout(
                  (): void => setIsHighlighted(false),
                  500,
                );
              }, 100);
              observer?.disconnect();
            }
          },
          { threshold: 0.1 },
        );
        observer.observe(element);
        setTimeout((): void => observer?.disconnect(), 3000);
      }
    };

    window.addEventListener("highlight-message", handleHighlight);
    return (): void => {
      window.removeEventListener("highlight-message", handleHighlight);
      if (observer) observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, [message.id]);

  const displayText: string = useMemo((): string => {
    if (!message.isEncrypted) return message.text;
    if (decryptedText) return decryptedText;
    if (error) return error;
    return "...";
  }, [message.isEncrypted, message.text, decryptedText, error]);

  const displayReplyText: string | undefined = message.replyTo?.isEncrypted
    ? (decryptedReplyText ?? "...")
    : message.replyTo?.text;

  const handleCopy = (): void => {
    if (displayText) navigator.clipboard.writeText(displayText);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger
          id={`msg-${message.id}`}
          className={cn(
            "flex w-full mb-1 px-4 min-w-0 overflow-hidden transition-colors ease-in-out",
            isMe ? "justify-end" : "justify-start",
            isHighlighted
              ? "bg-black/10 dark:bg-white/10 duration-100"
              : "duration-700",
          )}
        >
          <div className="grid grid-cols-1 max-w-[85%] sm:max-w-[70%] min-w-0">
            <div
              className={cn(
                "relative px-3 py-1.5 text-sm rounded-2xl shadow-sm min-w-0 overflow-hidden flex flex-col",
                isMe
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : "bg-muted text-foreground rounded-tl-none",
                isTemp && "opacity-70",
              )}
            >
              {message.replyTo && (
                <div
                  className={cn(
                    "mb-1.5 flex flex-col relative rounded-sm px-2 py-1 cursor-pointer overflow-hidden transition-colors hover:brightness-90 min-w-0 w-full shrink-0",
                    isMe ? "bg-primary-foreground/10" : "bg-primary/5",
                  )}
                  onClick={handleScrollToReply}
                >
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-0.75",
                      isMe ? "bg-primary-foreground/80" : "bg-primary/80",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[12px] font-medium leading-tight mb-0.5 ml-1 truncate",
                      isMe ? "text-primary-foreground" : "text-primary",
                    )}
                  >
                    {message.replyTo.sender.firstName}
                  </span>
                  <span className="text-[12px] truncate opacity-90 leading-tight ml-1">
                    {displayReplyText}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 min-w-0">
                <span className="block whitespace-pre-wrap break-all overflow-hidden wrap-anywhere">
                  {displayText}
                </span>
                <div
                  className={cn(
                    "flex items-center justify-end gap-1 mt-1 -mr-1 select-none pointer-events-none shrink-0",
                    isMe
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground/70",
                  )}
                >
                  {message.isEdited && (
                    <span className="text-[9px]">edited</span>
                  )}
                  <span className="text-[10px] leading-none">
                    {new Date(message.sentAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isMe && (
                    <span className="flex items-center justify-center w-3.5 h-3.5 shrink-0">
                      {isTemp ? (
                        <Clock className="h-3 w-3 animate-pulse" />
                      ) : isActuallyRead ? (
                        <CheckCheck className="h-3.5 w-3.5" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={(): void => onReply?.(message)}>
            <Reply className="mr-2 h-4 w-4" /> Reply
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" /> Copy
          </ContextMenuItem>
          <ContextMenuItem onClick={(): void => onForward?.(message)}>
            <Forward className="mr-2 h-4 w-4" /> Forward
          </ContextMenuItem>
          {isMe && !isTemp && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={(): void => onEdit?.(message)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </ContextMenuItem>
              <ContextMenuItem
                onClick={(): void => onDelete?.(message.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </ContextMenuItem>
            </>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem onClick={(): void => setIsInfoOpen(true)}>
            <Info className="mr-2 h-4 w-4" /> Message Info
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <MessageInfoDialog
        message={message}
        open={isInfoOpen}
        onOpenChange={setIsInfoOpen}
      />
    </>
  );
});
