import { useState, useMemo, memo, useEffect, type ReactElement } from "react";
import { Copy, Forward, Reply, Pencil, Trash2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/entities/chat/model/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { UserAvatar } from "@/components/user-avatar";
import { MessageInfoDialog } from "./message-info-dialog";
import { MessageStatus } from "./message-status";
import { getUserColorInfo, type ColorInfo } from "@/lib/user-colors";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  myId: string;
  chatType?: "PRIVATE" | "GROUP" | "CHANNEL";
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  lastReadSequence?: number;
  canWrite?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (message: Message) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export const MessageBubble = memo(function MessageBubble({
  message,
  isMe,
  chatType = "GROUP",
  isFirstInGroup = false,
  isLastInGroup = false,
  lastReadSequence,
  canWrite = true,
  onDelete,
  onEdit,
  onReply,
  onForward,
}: MessageBubbleProps): ReactElement {
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [isHighlighted, setIsHighlighted] = useState<boolean>(false);

  const isGroup: boolean = chatType === "GROUP";
  const showAvatar: boolean = !isMe && isGroup && isLastInGroup;
  const showName: boolean = !isMe && isGroup && isFirstInGroup;

  useEffect((): (() => void) => {
    const handleHighlight = (e: Event): void => {
      const customEvent: CustomEvent<{ id: string }> = e as CustomEvent<{
        id: string;
      }>;
      if (customEvent.detail.id === message.id) {
        setIsHighlighted(true);
        setTimeout((): void => setIsHighlighted(false), 1500);
      }
    };

    window.addEventListener("highlight-message", handleHighlight);
    return (): void =>
      window.removeEventListener("highlight-message", handleHighlight);
  }, [message.id]);

  const handleScrollToReply = (): void => {
    if (!message.replyTo) return;
    const targetId: string = `msg-${message.replyTo.id}`;
    const element: HTMLElement | null = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      window.dispatchEvent(
        new CustomEvent("highlight-message", {
          detail: { id: message.replyTo.id },
        }),
      );
    }
  };

  const renderText = (text: string): (string | ReactElement)[] => {
    return text.split(URL_REGEX).map((part, index) => {
      if (part.match(URL_REGEX)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "underline break-all",
              isMe
                ? "text-primary-foreground decoration-primary-foreground/40 hover:decoration-primary-foreground"
                : "text-primary decoration-primary/40 hover:decoration-primary",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const senderName: string = useMemo((): string => {
    const firstName: string | undefined = message.sender?.firstName;
    const lastName: string | undefined = message.sender?.lastName;
    const username: string | undefined = message.sender?.username;
    const full: string = [firstName, lastName].filter(Boolean).join(" ");
    return full || username || "User";
  }, [message.sender]);

  const replySenderName: string = useMemo((): string => {
    if (!message.replyTo) return "";
    const firstName: string | undefined = message.replyTo.sender?.firstName;
    const lastName: string | undefined = message.replyTo.sender?.lastName;
    const username: string | undefined = message.replyTo.sender?.username;
    const full: string = [firstName, lastName].filter(Boolean).join(" ");
    return full || username || "User";
  }, [message.replyTo]);

  const userColor: ColorInfo = useMemo(
    (): ColorInfo => getUserColorInfo(message.sender.id, senderName),
    [message.sender.id, senderName],
  );

  const bubbleRadius: string = useMemo((): string => {
    const rBig: string = "16px";
    const rSmall: string = "4px";
    if (isMe)
      return `${rBig} ${isFirstInGroup ? rBig : rSmall} ${isLastInGroup ? rBig : rSmall} ${rBig}`;
    return `${isFirstInGroup ? rBig : rSmall} ${rBig} ${rBig} ${isLastInGroup ? rBig : rSmall}`;
  }, [isMe, isFirstInGroup, isLastInGroup]);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger
          id={`msg-${message.id}`}
          className={cn(
            "flex w-full px-2 sm:px-4 outline-none py-[1px] transition-colors duration-300",
            isMe ? "justify-end" : "justify-start",
          )}
        >
          <div
            className={cn(
              "flex items-end gap-1.5 w-full",
              isMe ? "flex-row-reverse" : "flex-row",
            )}
          >
            <div className="w-8 shrink-0 flex justify-center pb-0.5">
              {showAvatar && (
                <UserAvatar
                  userId={message.sender.id}
                  src={message.sender?.photoUrl}
                  fallback={senderName}
                  size={32}
                />
              )}
            </div>

            <div
              style={{ borderRadius: bubbleRadius }}
              className={cn(
                "relative flex flex-col min-w-[60px] max-w-[80%] sm:max-w-[70%] px-2.5 py-1.5 shadow-sm overflow-hidden transition-colors duration-300",
                isMe
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 pointer-events-none transition-opacity duration-500 z-0",
                  isHighlighted ? "opacity-100" : "opacity-0",
                  isMe
                    ? "bg-white/30 dark:bg-black/40"
                    : "bg-primary/20 dark:bg-primary/30",
                )}
              />

              {showName && (
                <span
                  style={{ color: userColor.text }}
                  className="text-[12px] font-bold mb-0.5 truncate block w-full relative z-10"
                >
                  {senderName}
                </span>
              )}

              {message.replyTo && (
                <div
                  className={cn(
                    "relative z-10 mb-1.5 flex flex-col border-l-[3px] px-2 py-0.5 rounded-r-sm w-full overflow-hidden",
                    isMe
                      ? "bg-black/10 border-primary-foreground/60"
                      : "bg-primary/5 border-primary/60",
                    canWrite && "cursor-pointer hover:bg-opacity-80",
                  )}
                  onClick={canWrite ? handleScrollToReply : undefined}
                >
                  <span
                    className={cn(
                      "text-[11px] font-bold truncate",
                      isMe ? "text-primary-foreground" : "text-primary",
                    )}
                  >
                    {replySenderName}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] line-clamp-2 leading-tight mt-[1px] break-all",
                      isMe
                        ? "text-primary-foreground/90"
                        : "text-foreground/80",
                    )}
                  >
                    {message.replyTo.text}
                  </span>
                </div>
              )}

              <div className="flex flex-col w-full relative z-10">
                <div className="text-[15px] leading-snug whitespace-pre-wrap select-text break-words [word-break:break-word] [overflow-wrap:anywhere]">
                  {renderText(message.text)}
                </div>

                <div
                  className={cn(
                    "flex items-center gap-1 h-3.5 shrink-0 mt-1 self-end select-none",
                    isMe
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground/80",
                  )}
                >
                  <span className="text-[10px] font-medium tabular-nums">
                    {new Date(message.sentAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isMe && (
                    <MessageStatus
                      messageId={message.id}
                      isMe={isMe}
                      sequence={message.sequence ?? 0}
                      lastReadSequence={lastReadSequence ?? 0}
                      className="w-3 h-3 shrink-0"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-52">
          {canWrite && (
            <ContextMenuItem onClick={(): void => onReply?.(message)}>
              <Reply className="mr-2 h-4 w-4" /> Reply
            </ContextMenuItem>
          )}
          <ContextMenuItem
            onClick={(): void => {
              if (message.text) navigator.clipboard.writeText(message.text);
            }}
          >
            <Copy className="mr-2 h-4 w-4" /> Copy Text
          </ContextMenuItem>
          <ContextMenuItem onClick={(): void => onForward?.(message)}>
            <Forward className="mr-2 h-4 w-4" /> Forward
          </ContextMenuItem>
          {isMe && canWrite && (
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
            <Info className="mr-2 h-4 w-4" /> View Details
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
