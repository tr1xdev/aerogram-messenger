import {
  memo,
  useRef,
  useLayoutEffect,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { X, Pencil, Reply, ArrowUp, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "@/entities/chat/model/types";

interface MessageComposerProps {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  disabled: boolean;
  replyingTo: Message | null;
  editingMessage: Message | null;
  onCancelAction: () => void;
}

export const MessageComposer = memo(function MessageComposer({
  input,
  setInput,
  onSend,
  disabled,
  replyingTo,
  editingMessage,
  onCancelAction,
}: MessageComposerProps): ReactNode {
  const activeAction: Message | null = editingMessage || replyingTo;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasText: boolean = input.trim().length > 0;

  useEffect((): void => {
    if (activeAction) {
      textareaRef.current?.focus();
    }
  }, [activeAction]);

  useLayoutEffect((): void => {
    const textarea: HTMLTextAreaElement | null = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight: number = textarea.scrollHeight;
      const targetHeight: number =
        scrollHeight > 38 ? Math.min(scrollHeight, 200) : 38;
      textarea.style.height = `${targetHeight}px`;
    }
  }, [input]);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (hasText && !disabled) {
        onSend();
      }
    }
  };

  const handleAttachmentClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const files: FileList | null = e.target.files;
    if (files && files.length > 0) {
      e.target.value = "";
    }
  };

  return (
    <footer className="p-2 md:p-3 bg-background shrink-0">
      <div className="max-w-5xl mx-auto flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          {activeAction && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className="overflow-hidden min-w-0"
            >
              <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/20 rounded-t-2xl border-l-2 border-primary mx-1 ml-[46px] mb-0 relative min-w-0">
                <div className="shrink-0 text-primary opacity-80">
                  {editingMessage ? (
                    <Pencil className="h-3.5 w-3.5" />
                  ) : (
                    <Reply className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-1">
                  <span className="text-[11px] font-semibold text-primary truncate block">
                    {editingMessage
                      ? "Edit Message"
                      : replyingTo?.sender.first_name || "User"}
                  </span>
                  <span className="text-[12px] text-muted-foreground truncate block leading-tight">
                    {activeAction.text}
                  </span>
                </div>
                <button
                  type="button"
                  className="h-6 w-6 flex items-center justify-center rounded-full shrink-0 hover:bg-muted transition-colors text-muted-foreground"
                  onClick={onCancelAction}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2 relative min-w-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
          <Button
            type="button"
            size="icon"
            onClick={handleAttachmentClick}
            className="h-[38px] w-[38px] rounded-full shrink-0 bg-muted/40 border border-border/50 text-muted-foreground hover:text-primary hover:bg-muted/60 transition-colors shadow-none"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <div className="relative flex-1 min-w-0">
            <div
              className={cn(
                "w-full rounded-[20px] bg-muted/40 border border-border/50 transition-all duration-200 focus-within:bg-muted/60 focus-within:border-border pr-1",
                activeAction &&
                  "rounded-tl-none rounded-tr-none border-t-transparent",
              )}
            >
              <div className="relative flex items-end">
                <textarea
                  ref={textareaRef}
                  placeholder={editingMessage ? "Edit message..." : "Message"}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  className={cn(
                    "w-full resize-none bg-transparent px-4 py-[9px] text-[15px] focus:outline-none block",
                    "max-h-[200px] overflow-y-auto scrollbar-none leading-[20px]",
                  )}
                  style={{ height: "38px" }}
                />

                <div className="flex items-center justify-center h-[38px] pr-1 shrink-0">
                  <AnimatePresence initial={false}>
                    {hasText && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Button
                          type="button"
                          onClick={(): void => {
                            if (hasText && !disabled) onSend();
                          }}
                          disabled={disabled}
                          size="icon"
                          className="h-[28px] w-[28px] rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-90"
                        >
                          <ArrowUp className="h-4 w-4" strokeWidth={3} />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});
