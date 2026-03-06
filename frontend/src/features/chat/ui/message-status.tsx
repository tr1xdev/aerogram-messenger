import { Check, CheckCheck } from "lucide-react";

interface MessageStatusProps {
  isRead: boolean;
  isMe: boolean;
}

export function MessageStatus({ isRead, isMe }: MessageStatusProps) {
  if (!isMe) return null;

  return (
    <div className="flex items-center ml-1">
      {isRead ? (
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
