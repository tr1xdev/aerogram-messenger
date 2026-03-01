import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/entities/chat/model/types";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  isRead: boolean;
}

export function MessageBubble({ message, isMe, isRead }: MessageBubbleProps) {
  return (
    <div className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex flex-col max-w-[75%]",
          isMe ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "px-3 py-1.5 text-sm rounded-2xl",
            isMe
              ? "bg-primary text-primary-foreground rounded-tr-none"
              : "bg-muted rounded-tl-none",
            message.id.startsWith("temp-") && "opacity-70",
          )}
        >
          {message.text}
        </div>
        <div className="flex items-center gap-1 mt-1 px-1">
          <span className="text-[10px] text-muted-foreground">
            {new Date(message.sentAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isMe && (
            <span
              className={cn(
                "text-[10px] font-medium",
                isRead ? "text-primary" : "text-muted-foreground",
              )}
            >
              {message.id.startsWith("temp-") ? (
                <Clock className="h-2 w-2 inline mr-1" />
              ) : isRead ? (
                "Read"
              ) : (
                "Sent"
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
