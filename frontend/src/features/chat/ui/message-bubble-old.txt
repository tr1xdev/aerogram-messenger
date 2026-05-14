import { useState, useMemo, memo, useEffect, type ReactElement } from "react";
import { graphql, useFragment } from "react-relay";
import {
  Copy,
  Forward,
  Reply,
  Pencil,
  Trash2,
  Info,
  FileIcon,
  Download,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import type {
  messageBubble_message$key,
  messageBubble_message$data,
} from "./__generated__/messageBubble_message.graphql";

const MessageFragment = graphql`
  fragment messageBubble_message on Message {
    id
    text
    sentAt
    sequence
    attachments {
      id
      url
      fileName
      fileSize
      contentType
    }
    sender {
      id
      firstName
      lastName
      username
      photoUrl
    }
    replyTo {
      id
      text
      sender {
        firstName
        lastName
      }
    }
  }
`;

type Attachment = NonNullable<
  messageBubble_message$data["attachments"]
>[number];

interface MessageBubbleProps {
  message: messageBubble_message$key;
  isMe: boolean;
  myId: string;
  chatType?: "PRIVATE" | "GROUP" | "CHANNEL";
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  lastReadSequence?: number;
  canWrite?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (message: messageBubble_message$data) => void;
  onReply?: (message: messageBubble_message$data) => void;
  onForward?: (message: messageBubble_message$data) => void;
}

const URL_REGEX: RegExp = /(https?:\/\/[^\s]+)/g;

export const MessageBubble = memo(function MessageBubble({
  message: messageKey,
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
  const message: messageBubble_message$data = useFragment(
    MessageFragment,
    messageKey,
  );
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);
  const [isHighlighted, setIsHighlighted] = useState<boolean>(false);

  const isGroup: boolean = chatType === "GROUP";
  const showAvatar: boolean = !isMe && isGroup && isLastInGroup;
  const showName: boolean = !isMe && isGroup && isFirstInGroup;

  const { images, files } = useMemo(() => {
    const all: readonly Attachment[] = message.attachments ?? [];
    return {
      images: all.filter((a: Attachment) =>
        a.contentType?.startsWith("image/"),
      ),
      files: all.filter(
        (a: Attachment) => !a.contentType?.startsWith("image/"),
      ),
    };
  }, [message.attachments]);

  useEffect((): (() => void) => {
    const handleHighlight = (e: Event): void => {
      const customEvent = e as CustomEvent<{ id: string }>;
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

  const downloadFile = async (url: string, fileName: string): Promise<void> => {
    try {
      const response: Response = await fetch(url);
      const blob: Blob = await response.blob();
      const blobUrl: string = window.URL.createObjectURL(blob);
      const link: HTMLAnchorElement = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const AttachmentPreview = ({
    file,
    children,
  }: {
    file: Attachment;
    children: React.ReactNode;
  }): ReactElement => (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-screen h-screen max-w-none p-0 border-none bg-black/95 sm:bg-zinc-950/95 backdrop-blur-md z-[100] flex flex-col outline-none">
        <DialogTitle className="sr-only">Preview {file.fileName}</DialogTitle>
        <div className="flex items-center justify-between px-4 py-3 bg-black/20 border-b border-white/5 shrink-0 z-50">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-zinc-100 truncate">
              {file.fileName}
            </span>
            <span className="text-[10px] text-zinc-500">
              {(Number(file.fileSize) / 1024).toFixed(1)} KB
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => downloadFile(file.url, file.fileName)}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <Download size={20} />
            </button>
            <DialogClose className="p-2 text-zinc-400 hover:text-white transition-colors">
              <X size={24} />
            </DialogClose>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex items-center justify-center p-2 sm:p-8">
          {file.contentType?.startsWith("image/") ? (
            <img
              src={file.url}
              alt={file.fileName}
              className="max-w-full max-h-full object-contain shadow-2xl"
            />
          ) : (
            <iframe
              src={file.url}
              className="w-full h-full bg-white rounded-lg"
              title={file.fileName}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderAttachments = (): ReactElement | null => {
    if (images.length === 0 && files.length === 0) return null;
    return (
      <div className="flex flex-col gap-1.5 mb-2 relative z-10">
        {images.length > 0 && (
          <div
            className={cn(
              "grid gap-1 overflow-hidden rounded-xl",
              images.length === 1 ? "grid-cols-1" : "grid-cols-2",
            )}
          >
            {images.map((img: Attachment) => (
              <AttachmentPreview key={img.id} file={img}>
                <div className="relative cursor-pointer aspect-square bg-black/5 overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.fileName}
                    className="h-full w-full object-cover hover:opacity-90 transition-opacity"
                  />
                </div>
              </AttachmentPreview>
            ))}
          </div>
        )}
        {files.map((file: Attachment) => (
          <AttachmentPreview key={file.id} file={file}>
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer active:scale-[0.98] transition-all",
                isMe
                  ? "bg-neutral-50/80 border-neutral-200"
                  : "bg-background/60 border-border",
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0",
                  isMe
                    ? "bg-zinc-100 text-zinc-600"
                    : "bg-primary/10 text-primary",
                )}
              >
                <FileIcon size={20} />
              </div>
              <div className="flex flex-col overflow-hidden text-left">
                <span className="text-[13px] font-semibold truncate max-w-[150px]">
                  {file.fileName}
                </span>
                <span className="text-[11px] opacity-60">
                  {(Number(file.fileSize) / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
          </AttachmentPreview>
        ))}
      </div>
    );
  };

  const senderName: string = useMemo(
    () =>
      [message.sender?.firstName, message.sender?.lastName]
        .filter(Boolean)
        .join(" ") ||
      message.sender?.username ||
      "User",
    [message.sender],
  );
  const userColor: ColorInfo = useMemo(
    () => getUserColorInfo(message.sender?.id ?? "", senderName),
    [message.sender?.id, senderName],
  );
  const bubbleRadius: string = useMemo(() => {
    const rB: string = "20px",
      rS: string = "4px";
    return isMe
      ? `${rB} ${isFirstInGroup ? rB : rS} ${isLastInGroup ? rB : rS} ${rB}`
      : `${isFirstInGroup ? rB : rS} ${rB} ${rB} ${isLastInGroup ? rB : rS}`;
  }, [isMe, isFirstInGroup, isLastInGroup]);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger
          id={`msg-${message.id}`}
          className={cn(
            "flex w-full px-2 sm:px-4 py-[1px] outline-none",
            isMe ? "justify-end" : "justify-start",
          )}
        >
          <div
            className={cn(
              "flex items-end gap-2 w-full",
              isMe ? "flex-row-reverse" : "flex-row",
            )}
          >
            <div className="w-8 shrink-0 flex justify-center pb-0.5">
              {showAvatar && message.sender && (
                <UserAvatar
                  userId={message.sender.id}
                  src={message.sender.photoUrl ?? undefined}
                  fallback={senderName}
                  size={32}
                />
              )}
            </div>
            <div
              style={{ borderRadius: bubbleRadius }}
              className={cn(
                "relative flex flex-col min-w-[70px] max-w-[85%] sm:max-w-[70%] px-3.5 py-2 transition-all shadow-sm",
                isMe
                  ? "bg-white text-zinc-900 border border-neutral-100"
                  : "bg-muted text-foreground",
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 pointer-events-none transition-opacity duration-500",
                  isHighlighted ? "bg-primary/10 opacity-100" : "opacity-0",
                )}
              />
              {showName && (
                <span
                  style={{ color: userColor.text }}
                  className="text-[12px] font-bold mb-1 truncate block relative z-10"
                >
                  {senderName}
                </span>
              )}
              {message.replyTo && (
                <div
                  className={cn(
                    "relative z-10 mb-2 flex flex-col border-l-2 px-2.5 py-0.5 rounded-r-md bg-black/5 cursor-pointer",
                    isMe ? "border-zinc-300" : "border-primary/40",
                  )}
                  onClick={handleScrollToReply}
                >
                  <span className="text-[11px] font-bold truncate">
                    {message.replyTo.sender?.firstName || "User"}
                  </span>
                  <span className="text-[11px] line-clamp-1 opacity-70 italic">
                    {message.replyTo.text}
                  </span>
                </div>
              )}
              {renderAttachments()}
              <div className="relative z-10 flex flex-wrap items-end justify-between gap-x-3">
                {message.text && (
                  <div className="text-[15px] leading-snug whitespace-pre-wrap select-text break-words flex-1 min-w-0">
                    {message.text.split(URL_REGEX).map((part, i) =>
                      part.match(URL_REGEX) ? (
                        <a
                          key={i}
                          href={part}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-600 hover:text-blue-700 break-all"
                        >
                          {part}
                        </a>
                      ) : (
                        part
                      ),
                    )}
                  </div>
                )}
                <div
                  className={cn(
                    "flex items-center gap-1 h-4 select-none ml-auto",
                    isMe ? "text-zinc-400" : "text-muted-foreground/60",
                  )}
                >
                  <span className="text-[10px] font-medium">
                    {new Date(message.sentAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isMe && (
                    <MessageStatus
                      messageId={message.id}
                      isMe={isMe}
                      sequence={Number(message.sequence)}
                      lastReadSequence={lastReadSequence ?? 0}
                      className="w-3.5 h-3.5"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {canWrite && (
            <ContextMenuItem onClick={() => onReply?.(message)}>
              <Reply className="mr-2 h-4 w-4" /> Reply
            </ContextMenuItem>
          )}
          <ContextMenuItem
            onClick={() =>
              message.text && navigator.clipboard.writeText(message.text)
            }
          >
            <Copy className="mr-2 h-4 w-4" /> Copy
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onForward?.(message)}>
            <Forward className="mr-2 h-4 w-4" /> Forward
          </ContextMenuItem>
          {isMe && canWrite && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => onEdit?.(message)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onDelete?.(message.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </ContextMenuItem>
            </>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => setIsInfoOpen(true)}>
            <Info className="mr-2 h-4 w-4" /> Details
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
