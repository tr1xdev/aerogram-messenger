import { memo, useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Message } from "@/entities/chat/model/types";
import { Terminal, Copy, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MessageInfoDialogProps {
  message: Message;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DebugData {
  id: string;
  seq: number | undefined;
  type: "reply" | "forward" | "message";
  encryption: {
    enabled: boolean;
    iv: string | undefined;
  };
  meta: {
    sentAt: string | Date;
    isEdited: boolean | undefined;
  };
  sender: {
    id: string;
    key: string | undefined;
  };
  replyTo: {
    id: string;
    isEncrypted: boolean;
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
    const debugData: DebugData = {
      id: message.id,
      seq: message.sequence,
      type: message.replyTo
        ? "reply"
        : message.forwardedFrom
          ? "forward"
          : "message",
      encryption: {
        enabled: message.isEncrypted,
        iv: message.encryptionIv,
      },
      meta: {
        sentAt: message.sentAt,
        isEdited: message.isEdited,
      },
      sender: {
        id: message.sender.id,
        key: message.sender.publicKey
          ? message.sender.publicKey.slice(0, 16) + "..."
          : undefined,
      },
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            isEncrypted: message.replyTo.isEncrypted,
            senderId: message.replyTo.sender.id,
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
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

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
            aria-label={copied ? "Copied" : "Copy to clipboard"}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-all hover:bg-zinc-800 hover:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700 active:scale-95"
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
              {jsonString}
            </pre>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
});
