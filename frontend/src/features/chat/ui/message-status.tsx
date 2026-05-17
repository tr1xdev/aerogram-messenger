import { Check, CheckCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageStatusProps {
  messageId?: string;
  isSending?: boolean;
  isMe: boolean;
  chatType: "PRIVATE" | "GROUP" | "CHANNEL";
  sequence: number;
  lastReadSequence: number;
  className?: string;
}

export function MessageStatus({
  messageId,
  isSending,
  isMe,
  chatType,
  sequence,
  lastReadSequence,
  className,
}: MessageStatusProps) {
  if (!isMe) return null;

  const isTemp: boolean = messageId?.startsWith("temp-") ?? false;
  const isPending: boolean = isSending || isTemp || sequence === 0;

  const isReadContext: boolean = chatType === "PRIVATE" || chatType === "GROUP";
  const isActuallyRead: boolean =
    !isPending && isReadContext && sequence > 0 && sequence <= lastReadSequence;

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center w-4 h-4 shrink-0",
        className,
      )}
    >
      {isPending ? (
        <Clock className="h-3 w-3 animate-pulse opacity-70" strokeWidth={2.5} />
      ) : isActuallyRead ? (
        <CheckCheck className="h-3.5 w-3.5 text-inherit" strokeWidth={2.5} />
      ) : (
        <Check
          className="h-3.5 w-3.5 opacity-60 text-inherit"
          strokeWidth={2.5}
        />
      )}
    </div>
  );
}
