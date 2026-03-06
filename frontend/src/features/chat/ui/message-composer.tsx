import { memo } from "react";
import { SendHorizontal, X, Pencil, Reply } from "lucide-react";
import { Input } from "@/components/ui/input";
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

  return (
    <footer className="p-3 md:p-4 bg-background/95 backdrop-blur-sm border-t border-border/50 shrink-0">
      <div className="max-w-5xl mx-auto flex flex-col min-w-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeAction && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden min-w-0"
            >
              <div className="flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-t-xl border-l-2 border-primary mx-2 mb-0 relative min-w-0 overflow-hidden">
                <div className="shrink-0 text-primary opacity-80">
                  {editingMessage ? (
                    <Pencil className="h-4 w-4" />
                  ) : (
                    <Reply className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-1 overflow-hidden">
                  <span className="text-[12px] font-medium text-primary truncate block">
                    {editingMessage
                      ? "Edit Message"
                      : replyingTo?.sender.first_name || "User"}
                  </span>
                  <span className="text-[13px] text-muted-foreground truncate block leading-tight">
                    {activeAction.text}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full shrink-0 hover:bg-muted/80 text-muted-foreground"
                  onClick={onCancelAction}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form
          className="flex items-end gap-2.5 relative pt-1 min-w-0"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() && !disabled) {
              onSend();
            }
          }}
        >
          <div className="relative flex-1 min-w-0 flex items-center">
            <Input
              placeholder={editingMessage ? "Edit message..." : "Message"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={cn(
                "w-full min-h-[44px] rounded-[22px] bg-muted/30 px-5 py-3",
                "border border-border focus-visible:border-border/80 focus-visible:ring-1 focus-visible:ring-ring/20 focus-visible:bg-muted/60",
                "transition-all duration-200 placeholder:text-muted-foreground/60",
                activeAction &&
                  "rounded-tl-none rounded-tr-none border-t-transparent",
              )}
            />
          </div>

          <Button
            type="submit"
            disabled={disabled || !input.trim()}
            size="icon"
            className={cn(
              "h-[44px] w-[44px] rounded-full shrink-0 transition-all active:scale-95",
              "border border-border shadow-sm",
              !input.trim()
                ? "bg-muted/50 text-muted-foreground/60 border-border/70"
                : "bg-primary text-primary-foreground border-primary",
            )}
          >
            <SendHorizontal className="h-5 w-5 ml-0.5" />
          </Button>
        </form>
      </div>
    </footer>
  );
});
