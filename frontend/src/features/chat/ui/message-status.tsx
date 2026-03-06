import { Check, CheckCheck } from "lucide-react";

interface MessageStatusProps {
  isRead: boolean;
  isMe: boolean;
  sequence?: number;
  lastReadSequence?: number;
}

export function MessageStatus({
  isRead,
  isMe,
  sequence,
  lastReadSequence,
}: MessageStatusProps) {
  if (!isMe) return null;

  const isActuallyRead =
    isRead ||
    (sequence !== undefined &&
      lastReadSequence !== undefined &&
      sequence <= lastReadSequence);

  return (
    <div className="flex items-center ml-1">
      {isActuallyRead ? (
        <CheckCheck className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
      ) : (
        <Check
          className="h-3.5 w-3.5 text-muted-foreground/40"
          strokeWidth={2.5}
        />
      )}
    </div>
  );
}
