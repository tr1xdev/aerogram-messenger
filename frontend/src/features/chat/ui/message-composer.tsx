import {
  memo,
  useRef,
  useLayoutEffect,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { SendHorizontal, X, Pencil, Reply } from "lucide-react";
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
}: MessageComposerProps) {
  const activeAction = editingMessage || replyingTo;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // 1. Мгновенно сбрасываем высоту в auto, чтобы браузер пересчитал scrollHeight под текущий текст
      textarea.style.height = "auto";

      // 2. Получаем реальную высоту контента
      const scrollHeight = textarea.scrollHeight;

      // 3. Устанавливаем итоговую высоту (минимум 44px, максимум 200px)
      // Мы используем inline-style напрямую для максимальной производительности
      const targetHeight = scrollHeight > 44 ? Math.min(scrollHeight, 200) : 44;
      textarea.style.height = `${targetHeight}px`;
    }
  }, [input]);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <footer className="p-3 md:p-4 bg-background/95 backdrop-blur-sm border-t border-border/50 shrink-0">
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
              <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-t-xl border-l-2 border-primary mx-2 mb-0 relative min-w-0">
                <div className="shrink-0 text-primary opacity-80">
                  {editingMessage ? (
                    <Pencil className="h-4 w-4" />
                  ) : (
                    <Reply className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-1">
                  <span className="text-[12px] font-medium text-primary truncate block">
                    {editingMessage
                      ? "Edit Message"
                      : replyingTo?.sender.first_name || "User"}
                  </span>
                  <span className="text-[13px] text-muted-foreground truncate block leading-tight">
                    {activeAction.text}
                  </span>
                </div>
                <button
                  type="button"
                  className="h-7 w-7 flex items-center justify-center rounded-full shrink-0 hover:bg-muted transition-colors text-muted-foreground"
                  onClick={onCancelAction}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2.5 relative pt-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <div
              className={cn(
                "w-full rounded-[22px] bg-muted/30 border border-border overflow-hidden transition-colors duration-200 focus-within:bg-muted/50 focus-within:border-primary/30",
                activeAction &&
                  "rounded-tl-none rounded-tr-none border-t-transparent",
              )}
            >
              <textarea
                ref={textareaRef}
                placeholder={editingMessage ? "Edit message..." : "Message"}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                className={cn(
                  "w-full resize-none bg-transparent px-5 py-[11px] text-sm focus:outline-none block",
                  "max-h-[200px] overflow-y-auto scrollbar-none",
                  "leading-[22px]",
                )}
                style={{ height: "44px" }}
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={() => {
              if (input.trim() && !disabled) onSend();
            }}
            disabled={disabled || !input.trim()}
            size="icon"
            className={cn(
              "h-[44px] w-[44px] rounded-full shrink-0 transition-all active:scale-95 mb-[0.5px]",
              "border border-border shadow-sm",
              !input.trim()
                ? "bg-muted/50 text-muted-foreground/60 border-border/70"
                : "bg-primary text-primary-foreground border-primary",
            )}
          >
            <SendHorizontal className="h-5 w-5 ml-0.5" />
          </Button>
        </div>
      </div>
    </footer>
  );
});
