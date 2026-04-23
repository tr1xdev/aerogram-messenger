import {
  memo,
  useRef,
  useEffect,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { X, Pencil, Reply, ArrowUp, Paperclip, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "@/entities/chat/model/types";

interface MessageComposerProps {
  input: string;
  setInput: (val: string) => void;
  onSend: (text?: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled: boolean;
  replyingTo: Message | null;
  editingMessage: Message | null;
  onCancelAction: () => void;
  isBot: boolean;
  isEmpty: boolean;
  canWrite: boolean;
  chatType?: "PRIVATE" | "GROUP" | "CHANNEL";
}

export const MessageComposer = memo(function MessageComposer({
  input,
  setInput,
  onSend,
  onTyping,
  disabled,
  replyingTo,
  editingMessage,
  onCancelAction,
  isBot,
  isEmpty,
  canWrite,
  chatType,
}: MessageComposerProps): ReactNode {
  const activeAction: Message | null = editingMessage || replyingTo;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef<boolean>(false);

  const stopTyping = useCallback((): void => {
    if (isTypingRef.current && onTyping) {
      onTyping(false);
      isTypingRef.current = false;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [onTyping]);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>): void => {
      const value: string = e.target.value;
      setInput(value);

      if (!onTyping) return;

      if (!isTypingRef.current && value.length > 0) {
        isTypingRef.current = true;
        onTyping(true);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (value.length === 0) {
        stopTyping();
      } else {
        typingTimeoutRef.current = setTimeout(stopTyping, 3000);
      }
    },
    [setInput, onTyping, stopTyping],
  );

  const handleSendAndStopTyping = useCallback((): void => {
    stopTyping();
    onSend();
  }, [onSend, stopTyping]);

  const handleStartBot = useCallback((): void => {
    onSend("/start");
  }, [onSend]);

  const adjustHeight = useCallback((): void => {
    const textarea: HTMLTextAreaElement | null = textareaRef.current;
    if (textarea) {
      textarea.style.height = "38px";
      const scrollHeight: number = textarea.scrollHeight;
      if (scrollHeight > 38) {
        textarea.style.height = `${Math.min(scrollHeight, 200)}px`;
      }
    }
  }, []);

  useEffect((): void => {
    if (activeAction) {
      textareaRef.current?.focus();
    }
  }, [activeAction]);

  useEffect((): void => {
    adjustHeight();
  }, [input, adjustHeight]);

  useEffect((): (() => void) => {
    return (): void => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (input.trim().length > 0 && !disabled && canWrite) {
          handleSendAndStopTyping();
        }
      }
    },
    [input, disabled, canWrite, handleSendAndStopTyping],
  );

  const handleAttachmentClick = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const showStartButton: boolean = isBot && isEmpty && chatType === "PRIVATE";

  return (
    <footer className="p-2 md:p-3 bg-background shrink-0 border-t border-border/40">
      <div className="max-w-5xl mx-auto flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          {activeAction && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            >
              <div className="flex items-center gap-3 px-3 py-2 bg-muted/20 rounded-t-2xl border-l-2 border-primary mx-1 ml-[46px] mb-[-1px] relative min-w-0">
                <div className="shrink-0 text-primary">
                  {editingMessage ? (
                    <Pencil className="h-3.5 w-3.5" />
                  ) : (
                    <Reply className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-primary truncate block uppercase tracking-tight">
                    {editingMessage
                      ? "Edit Message"
                      : replyingTo?.sender.firstName}
                  </span>
                  <span className="text-[13px] text-muted-foreground truncate block leading-tight">
                    {activeAction.text}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onCancelAction}
                  className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!canWrite ? (
          <div className="flex items-center justify-center w-full px-4 h-11 bg-muted/30 rounded-xl border border-border/50 select-none cursor-not-allowed">
            <div className="flex items-center gap-2.5 text-muted-foreground/70">
              <Lock className="h-4 w-4" />
              <span className="text-[13.5px] font-medium tracking-wide">
                Writing messages is restricted
              </span>
            </div>
          </div>
        ) : showStartButton ? (
          <div className="flex justify-center w-full px-1">
            <Button
              onClick={handleStartBot}
              disabled={disabled}
              className="w-full uppercase h-10 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold transition-all border border-primary/20"
            >
              Start
            </Button>
          </div>
        ) : (
          <div className="flex items-end gap-2 relative">
            <input type="file" ref={fileInputRef} className="hidden" multiple />
            <Button
              type="button"
              size="icon"
              onClick={handleAttachmentClick}
              disabled={disabled}
              className="h-[38px] w-[38px] rounded-full shrink-0 bg-muted/40 text-muted-foreground hover:text-primary transition-colors"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            <div className="relative flex-1 min-w-0">
              <div
                className={cn(
                  "w-full rounded-[20px] bg-muted/40 border border-border/50 transition-all duration-200 focus-within:bg-muted/60 pr-1",
                  activeAction &&
                    "rounded-tl-none rounded-tr-none border-t-transparent",
                )}
              >
                <div className="flex items-end">
                  <textarea
                    ref={textareaRef}
                    placeholder="Message"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    rows={1}
                    className="w-full resize-none bg-transparent px-4 py-[9px] text-[15px] focus:outline-none max-h-[200px] scrollbar-none leading-[20px]"
                  />
                  <div className="flex items-center justify-center h-[38px] pr-1">
                    {input.trim().length > 0 && (
                      <Button
                        type="button"
                        onClick={handleSendAndStopTyping}
                        disabled={disabled}
                        size="icon"
                        className="h-7 w-7 rounded-full bg-primary text-primary-foreground active:scale-90 transition-transform"
                      >
                        <ArrowUp className="h-4 w-4" strokeWidth={3} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
});
