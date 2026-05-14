import { useState, useMemo, memo, type ReactElement } from "react";
import { graphql, useFragment } from "react-relay";
import { cn } from "@/lib/utils";
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";
import { UserAvatar } from "@/components/user-avatar";
import { MessageInfoDialog } from "../message-info-dialog";
import { MessageStatus } from "../message-status";
import { getUserColorInfo, type ColorInfo } from "@/lib/user-colors";

import { useMessageHighlight } from "./hooks/use-message-highlight";
import { AttachmentList } from "./ui/attachment-list";
import { MessageReplyPreview } from "./ui/message-reply-preview";
import { MessageText } from "./ui/message-text";
import { MessageContextMenuContent } from "./ui/message-context-menu-content";

import type {
  messageBubble_message$key,
  messageBubble_message$data,
} from "../__generated__/messageBubble_message.graphql";

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
  const isHighlighted: boolean = useMessageHighlight(message.id);

  const isGroup: boolean = chatType === "GROUP";
  const showAvatar: boolean = !isMe && isGroup && isLastInGroup;
  const showName: boolean = !isMe && isGroup && isFirstInGroup;

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
    const rB: string = "20px";
    const rS: string = "4px";
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
                <MessageReplyPreview replyTo={message.replyTo} isMe={isMe} />
              )}

              {message.attachments && (
                <AttachmentList attachments={message.attachments} isMe={isMe} />
              )}

              <div className="relative z-10 flex flex-wrap items-end justify-between gap-x-3">
                {message.text && <MessageText text={message.text} />}

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

        <MessageContextMenuContent
          message={message}
          isMe={isMe}
          canWrite={canWrite}
          onReply={onReply}
          onEdit={onEdit}
          onForward={onForward}
          onDelete={onDelete}
          onShowInfo={() => setIsInfoOpen(true)}
        />
      </ContextMenu>

      <MessageInfoDialog
        message={message}
        open={isInfoOpen}
        onOpenChange={setIsInfoOpen}
      />
    </>
  );
});
