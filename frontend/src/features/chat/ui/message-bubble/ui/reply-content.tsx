import { type ReactElement } from "react";
import { cn } from "@/lib/utils";

interface ReplyContentProps {
  replyTo: {
    readonly id: string;
    readonly text: string | null;
    readonly sender: {
      readonly firstName: string;
      readonly lastName: string;
    } | null;
  };
  isMe: boolean;
}

export const ReplyContent = ({
  replyTo,
  isMe,
}: ReplyContentProps): ReactElement => {
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

  return (
    <div
      className={cn(
        "relative z-10 mb-2 flex flex-col border-l-2 px-2.5 py-0.5 rounded-r-md bg-black/5 cursor-pointer",
        isMe ? "border-zinc-300" : "border-primary/40",
      )}
      onClick={handleScrollToReply}
    >
      <span className="text-[11px] font-bold truncate">
        {replyTo.sender?.firstName || "User"}
      </span>
      <span className="text-[11px] line-clamp-1 opacity-70 italic">
        {replyTo.text}
      </span>
    </div>
  );
};
