import { memo, useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "@/entities/chat/model/types";
import type { messageBubble_message$data } from "@/features/chat/ui/message-bubble/__generated__/messageBubble_message.graphql";
import { Terminal, Copy, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MessageInfoDialogProps {
  message: messageBubble_message$data;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DebugData {
  id: string;
  seq: number | undefined;
  type: "reply" | "forward" | "message";
  meta: {
    sentAt: string | Date;
    isEdited: boolean | undefined;
  };
  sender: {
    id: string;
  };
  replyTo: {
    id: string;
    senderId: string;
  } | null;
}

export const MessageInfoDialog = memo(function MessageInfoDialog({
  message,
  open,
  onOpenChange,
}: MessageInfoDialogProps) {
  const isMobile: boolean = useIsMobile();
  const [copied, setCopied] = useState<boolean>(false);

  const jsonString: string = useMemo((): string => {
    if (!message) return "";

    const msg = message as unknown as Message;

    const debugData: DebugData = {
      id: msg.id,
      seq: msg.sequence,
      type: msg.replyTo ? "reply" : msg.forwardedFrom ? "forward" : "message",
      meta: {
        sentAt: msg.sentAt,
        isEdited: msg.isEdited,
      },
      sender: {
        id: msg.sender?.id ?? "unknown",
      },
      replyTo: msg.replyTo
        ? {
            id: msg.replyTo.id,
            senderId: msg.replyTo.sender?.id ?? "unknown",
          }
        : null,
    };

    return JSON.stringify(debugData, null, 2);
  }, [message]);

  useEffect((): (() => void) => {
    let timeout: ReturnType<typeof setTimeout>;
    if (copied) {
      timeout = setTimeout((): void => setCopied(false), 2000);
    }
    return (): void => clearTimeout(timeout);
  }, [copied]);

  const handleCopy = async (): Promise<void> => {
    if (!jsonString) return;
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 gap-0 bg-zinc-950 border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200",
          isMobile
            ? "w-[95vw] max-w-none rounded-lg"
            : "sm:max-w-112.5 sm:rounded-xl",
        )}
      >
        <DialogHeader className="p-3 pr-12 border-b border-zinc-800 bg-zinc-900/50 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="flex items-center gap-2 text-zinc-500 text-[10px] font-mono uppercase tracking-[0.2em]">
            <Terminal className="h-3.5 w-3.5 shrink-0" />
            Inspector
          </DialogTitle>
          <button
            onClick={handleCopy}
            disabled={!jsonString}
            aria-label={copied ? "Copied" : "Copy to clipboard"}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-all hover:bg-zinc-800 hover:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700 active:scale-95 disabled:opacity-50"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500 animate-in zoom-in" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </DialogHeader>

        <ScrollArea
          className={cn(
            "bg-black/20",
            isMobile ? "max-h-[60vh]" : "max-h-[70vh]",
          )}
        >
          <div className="p-4 font-mono text-[11px] leading-relaxed select-text">
            <pre className="text-blue-400/90 whitespace-pre-wrap break-all">
              {jsonString || "No data available"}
            </pre>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
});
