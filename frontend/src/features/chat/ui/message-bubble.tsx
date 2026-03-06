import { useState, useEffect, memo } from "react";
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

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  isRead: boolean;
  myId: string;
  peerPublicKey?: string;
  onDelete?: (id: string) => void;
  onEdit?: (message: Message) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isMe,
  isRead,
  myId,
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

  const isTemp = message.id.startsWith("temp-") || message.id.length < 10;

  useEffect(() => {
    let isMounted = true;

    const decrypt = async (
      text: string,
      iv: string,
      isMsgMe: boolean,
      senderPub?: string,
    ): Promise<string | null> => {
      try {
        const privKeyObj = await getPrivateKey(myId);
        const pubKey = isMsgMe ? peerPublicKey : senderPub;
        if (!privKeyObj || !pubKey || !iv) return null;
        return await decryptText(text, iv, pubKey, privKeyObj);
      } catch {
        return null;
      }
    };

    const processAll = async (): Promise<void> => {
      if (message.isEncrypted && message.encryptionIv) {
        const res = await decrypt(
          message.text,
          message.encryptionIv,
          isMe,
          message.sender?.publicKey,
        );
        if (isMounted) setDecryptedText(res || "Decryption error");
      }

      if (message.replyTo?.isEncrypted && message.replyTo.encryptionIv) {
        const isReplyMe = message.replyTo.sender.id === myId;
        const res = await decrypt(
          message.replyTo.text,
          message.replyTo.encryptionIv,
          isReplyMe,
          message.replyTo.sender.publicKey,
        );
        if (isMounted) setDecryptedReplyText(res);
      }
    };

    processAll();
    return () => {
      isMounted = false;
    };
  }, [message, myId, isMe, peerPublicKey]);

  const displayText = message.isEncrypted
    ? (decryptedText ?? "...")
    : message.text;
  const displayReplyText = message.replyTo?.isEncrypted
    ? (decryptedReplyText ?? "...")
    : message.replyTo?.text;

  const handleCopy = (): void => {
    if (displayText) navigator.clipboard.writeText(displayText);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger
        className={cn(
          "flex w-full mb-1 px-4 min-w-0 overflow-hidden",
          isMe ? "justify-end" : "justify-start",
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
                  "mb-1.5 flex flex-col relative rounded-sm px-2 py-1 cursor-pointer overflow-hidden transition-colors hover:brightness-95 min-w-0 w-full shrink-0",
                  isMe ? "bg-primary-foreground/10" : "bg-primary/5",
                )}
                onClick={() => {
                  const el = document.getElementById(
                    `msg-${message.replyTo?.id}`,
                  );
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-[3px]",
                    isMe ? "bg-primary-foreground/80" : "bg-primary/80",
                  )}
                />
                <span
                  className={cn(
                    "text-[12px] font-medium leading-tight mb-0.5 ml-1 truncate",
                    isMe ? "text-primary-foreground" : "text-primary",
                  )}
                >
                  {message.replyTo.sender.first_name}
                </span>
                <span className="text-[12px] truncate opacity-90 leading-tight ml-1">
                  {displayReplyText}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 min-w-0">
              <span className="block whitespace-pre-wrap break-all overflow-hidden [word-break:break-word] [overflow-wrap:anywhere]">
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
                {message.isEdited && <span className="text-[9px]">edited</span>}
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
                    ) : isRead ? (
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
        <ContextMenuItem onClick={() => onReply?.(message)}>
          <Reply className="mr-2 h-4 w-4" /> Reply
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" /> Copy
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onForward?.(message)}>
          <Forward className="mr-2 h-4 w-4" /> Forward
        </ContextMenuItem>

        {isMe && !isTemp && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onEdit?.(message)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onDelete?.(message.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </ContextMenuItem>
          </>
        )}

        <ContextMenuSeparator />
        <ContextMenuItem>
          <Info className="mr-2 h-4 w-4" /> Message Info
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});
