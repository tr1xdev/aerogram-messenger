import { type ReactElement } from "react";
import { cn } from "@/lib/utils";

interface ReplyTo {
  readonly id: string;
  readonly text: string | null | undefined;
  readonly sender?: {
    readonly firstName: string;
    readonly lastName?: string | null;
  } | null;
}

interface MessageReplyPreviewProps {
  replyTo: ReplyTo;
  isMe: boolean;
}

export const MessageReplyPreview = ({
  replyTo,
  isMe,
}: MessageReplyPreviewProps): ReactElement => {
  const handleScrollToReply = (): void => {
    const targetId: string = `msg-${replyTo.id}`;
    const element: HTMLElement | null = document.getElementById(targetId);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      window.dispatchEvent(
        new CustomEvent("highlight-message", {
          detail: { id: replyTo.id },
        }),
      );
    }
  };

  const senderName: string = replyTo.sender
    ? replyTo.sender.lastName
      ? `${replyTo.sender.firstName} ${replyTo.sender.lastName}`
      : replyTo.sender.firstName
    : "User";

  const hasText: boolean =
    typeof replyTo.text === "string" && replyTo.text.trim().length > 0;
  const displayReplyText: string = hasText
    ? (replyTo.text as string)
    : "Attachment";

  return (
    <div
      className={cn(
        "relative z-10 mb-1.5 flex gap-2.5 py-0.5 pr-2 pl-3 rounded-r-md cursor-pointer select-none border border-transparent transition-colors",
        isMe
          ? "bg-zinc-500/5 hover:bg-zinc-500/10"
          : "bg-black/5 hover:bg-black/10",
      )}
      onClick={handleScrollToReply}
    >
      <div className="absolute left-0 top-0.5 bottom-0.5 w-[3px] rounded-full bg-sky-500" />

      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[12px] font-semibold truncate leading-tight text-sky-500">
          {senderName}
        </span>
        <span
          className={cn(
            "text-[12.5px] line-clamp-1 leading-tight mt-0.5",
            hasText
              ? isMe
                ? "text-zinc-600"
                : "text-foreground/80"
              : isMe
                ? "text-zinc-500/90 italic font-medium"
                : "text-muted-foreground/85 italic font-medium",
          )}
        >
          {displayReplyText}
        </span>
      </div>
    </div>
  );
};
