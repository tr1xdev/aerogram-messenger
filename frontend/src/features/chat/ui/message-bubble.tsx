import { useState, useEffect, useMemo, memo, type ReactElement } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Forward, Reply, Pencil, Trash2, Info } from "lucide-react";
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
import { MessageStatus } from "./message-status";

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

  useEffect((): (() => void) => {
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
        const isReplyMe: boolean = message.replyTo.sender?.id === myId;
        const res: string | null = await decrypt(
          message.replyTo.text,
          message.replyTo.encryptionIv,
          isReplyMe,
          message.replyTo.sender?.publicKey,
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

  useEffect((): (() => void) => {
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
                  800,
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

  const replySenderName: string = useMemo((): string => {
    if (!message.replyTo) return "";
    return message.replyTo.sender?.firstName || "User";
  }, [message.replyTo]);

  const handleCopy = (): void => {
    if (displayText) navigator.clipboard.writeText(displayText);
  };

  const markdownComponents: Components = useMemo(
    (): Components => ({
      p: ({ children }): ReactElement => (
        <p className="m-0 leading-relaxed break-words whitespace-pre-wrap">
          {children}
        </p>
      ),
      a: ({ href, children }): ReactElement => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "underline underline-offset-2 hover:opacity-80 transition-opacity",
            isMe ? "text-primary-foreground" : "text-primary",
          )}
        >
          {children}
        </a>
      ),
      code: ({ className, children, ...props }): ReactElement => {
        const content: string = String(children).replace(/\n$/, "");
        const match: RegExpExecArray | null = /language-(\w+)/.exec(
          className || "",
        );
        const isBlock: boolean =
          !props.node?.properties?.["inline"] && content.includes("\n");

        if (isBlock || match) {
          return (
            <div className="my-2 rounded-xl overflow-hidden text-[13px] border border-black/20 dark:border-white/10 shadow-inner">
              <SyntaxHighlighter
                style={oneDark as { [key: string]: React.CSSProperties }}
                language={match?.[1] || "typescript"}
                PreTag="div"
                codeTagProps={{
                  style: {
                    background: "transparent",
                    color: "inherit",
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  },
                }}
                customStyle={{
                  margin: 0,
                  padding: "14px",
                  background: "#1e1e1e",
                  fontSize: "13px",
                  lineHeight: "1.6",
                }}
              >
                {content}
              </SyntaxHighlighter>
            </div>
          );
        }

        return (
          <code
            className={cn(
              "px-1.5 py-0.5 rounded-md text-[0.9em] font-mono antialiased",
              isMe ? "bg-black/30 text-white" : "bg-black/10 dark:bg-white/10",
            )}
          >
            {children}
          </code>
        );
      },
      ul: ({ children }): ReactElement => (
        <ul className="list-disc ml-4 my-1 space-y-0.5">{children}</ul>
      ),
      ol: ({ children }): ReactElement => (
        <ol className="list-decimal ml-4 my-1 space-y-0.5">{children}</ol>
      ),
      li: ({ children }): ReactElement => (
        <li className="leading-normal">{children}</li>
      ),
    }),
    [isMe],
  );

  const timeString = useMemo(() => {
    return new Date(message.sentAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [message.sentAt]);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger
          id={`msg-${message.id}`}
          className={cn(
            "flex w-full mb-0.5 px-4 min-w-0 overflow-hidden transition-colors duration-500",
            isMe ? "justify-end" : "justify-start",
            isHighlighted && "bg-primary/10",
          )}
        >
          <div
            className={cn(
              "grid grid-cols-1 max-w-[85%] sm:max-w-[70%] min-w-0",
              isMe ? "items-end" : "items-start",
            )}
          >
            <div
              className={cn(
                "relative px-2.5 py-1.5 text-[15px] rounded-2xl shadow-sm min-w-[60px] flex flex-col transition-transform active:scale-[0.99]",
                isMe
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : "bg-muted text-foreground rounded-tl-none",
                message.isSending && "opacity-70",
              )}
            >
              {message.replyTo && (
                <div
                  className={cn(
                    "mb-1.5 flex flex-col relative rounded-lg px-2.5 py-1 cursor-pointer overflow-hidden transition-all hover:brightness-95 min-w-0 w-full shrink-0",
                    isMe ? "bg-black/10" : "bg-primary/5",
                  )}
                  onClick={handleScrollToReply}
                >
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-1",
                      isMe ? "bg-primary-foreground/60" : "bg-primary/60",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[12px] font-semibold leading-tight mb-0.5 truncate",
                      isMe ? "text-primary-foreground" : "text-primary",
                    )}
                  >
                    {replySenderName}
                  </span>
                  <span className="text-[12px] truncate opacity-80 leading-tight">
                    {displayReplyText}
                  </span>
                </div>
              )}

              <div className="flex flex-col min-w-0 relative">
                <div className="markdown-content prose prose-sm dark:prose-invert max-w-none prose-p:leading-snug prose-pre:p-0 prose-pre:bg-transparent">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={markdownComponents}
                  >
                    {displayText}
                  </ReactMarkdown>
                </div>

                <div
                  className={cn(
                    "flex items-center justify-end gap-1 h-3 mt-1 self-end select-none pointer-events-none shrink-0",
                    isMe
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground/60",
                  )}
                >
                  {message.isEdited && (
                    <span className="text-[9px] font-medium italic mr-0.5">
                      edited
                    </span>
                  )}
                  <span className="text-[10px] font-medium leading-none">
                    {timeString}
                  </span>
                  {isMe && (
                    <MessageStatus
                      isMe={isMe}
                      isSending={message.isSending}
                      isRead={!!message.isRead || !!isRead}
                      sequence={message.sequence}
                      lastReadSequence={lastReadSequence}
                      className="w-3.5 h-3.5 ml-0.5"
                    />
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
          {isMe && !message.isSending && (
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
