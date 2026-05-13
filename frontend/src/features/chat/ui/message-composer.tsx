import {
  memo,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  X,
  Pencil,
  Reply,
  ArrowUp,
  Paperclip,
  Lock,
  FileIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Message } from "@/entities/chat/model/types";

interface MessageComposerProps {
  input: string;
  setInput: (val: string) => void;
  onSend: (text?: string, files?: File[]) => void;
  onJoin?: () => void;
  onTyping?: (isTyping: boolean) => void;
  disabled: boolean;
  replyingTo: Message | null;
  editingMessage: Message | null;
  onCancelAction: () => void;
  isBot: boolean;
  isEmpty: boolean;
  canWrite: boolean;
  isMember: boolean;
  chatType?: "PRIVATE" | "GROUP" | "CHANNEL";
}

export const MessageComposer = memo(function MessageComposer({
  input,
  setInput,
  onSend,
  onJoin,
  onTyping,
  disabled,
  replyingTo,
  editingMessage,
  onCancelAction,
  isBot,
  isEmpty,
  canWrite,
  isMember,
  chatType,
}: MessageComposerProps): ReactNode {
  console.log("[MessageComposer] Render", {
    input,
    disabled,
    isBot,
    isEmpty,
    canWrite,
    isMember,
    chatType,
    hasReplyingTo: !!replyingTo,
    hasEditingMessage: !!editingMessage,
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const activeAction: Message | null = editingMessage || replyingTo;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef<boolean>(false);

  const showStartButton: boolean = useMemo(() => {
    const result: boolean =
      isBot &&
      chatType === "PRIVATE" &&
      isEmpty &&
      !activeAction &&
      attachments.length === 0;
    console.log("[MessageComposer] showStartButton calculation:", result);
    return result;
  }, [isBot, chatType, isEmpty, activeAction, attachments.length]);

  const showJoinButton: boolean = useMemo(() => {
    const result: boolean =
      !isMember && (chatType === "CHANNEL" || chatType === "GROUP");
    console.log("[MessageComposer] showJoinButton calculation:", result);
    return result;
  }, [isMember, chatType]);

  const stopTyping = useCallback((): void => {
    console.log("[MessageComposer] stopTyping triggered");
    if (isTypingRef.current && onTyping) {
      console.log("[MessageComposer] Notifying parent: typing stopped");
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
      console.log("[MessageComposer] handleInputChange:", value);
      setInput(value);

      if (!onTyping) return;

      if (!isTypingRef.current && value.length > 0) {
        console.log("[MessageComposer] Notifying parent: typing started");
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

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      console.log("[MessageComposer] handleFileChange", e.target.files);
      if (e.target.files) {
        const newFiles: File[] = Array.from(e.target.files);
        setAttachments((prev: File[]) => {
          const updated: File[] = [...prev, ...newFiles];
          console.log("[MessageComposer] Attachments updated:", updated);
          return updated;
        });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [],
  );

  const removeAttachment = useCallback((index: number): void => {
    console.log("[MessageComposer] removeAttachment at index:", index);
    setAttachments((prev: File[]) =>
      prev.filter((_, i: number) => i !== index),
    );
  }, []);

  const handleSendAndStopTyping = useCallback((): void => {
    console.log("[MessageComposer] handleSendAndStopTyping", {
      input,
      attachmentsCount: attachments.length,
      disabled,
      canWrite,
    });
    if (disabled || !canWrite) return;
    if (input.trim().length === 0 && attachments.length === 0) return;

    stopTyping();
    onSend(input, attachments);
    setAttachments([]);
  }, [onSend, stopTyping, disabled, canWrite, input, attachments]);

  const handleStartBot = useCallback((): void => {
    console.log("[MessageComposer] handleStartBot executing /start");
    onSend("/start");
  }, [onSend]);

  const handleJoinClick = useCallback((): void => {
    console.log("[MessageComposer] handleJoinClick triggered");
    if (!onJoin || disabled) return;
    onJoin();
  }, [onJoin, disabled]);

  const adjustHeight = useCallback((): void => {
    const textarea: HTMLTextAreaElement | null = textareaRef.current;
    if (textarea) {
      textarea.style.height = "38px";
      const scrollHeight: number = textarea.scrollHeight;
      if (scrollHeight > 38) {
        const newHeight: string = `${Math.min(scrollHeight, 200)}px`;
        textarea.style.height = newHeight;
        console.log(
          "[MessageComposer] Textarea height adjusted to:",
          newHeight,
        );
      }
    }
  }, []);

  useEffect((): void => {
    if (activeAction) {
      console.log("[MessageComposer] Action detected, focusing textarea");
      textareaRef.current?.focus();
    }
  }, [activeAction]);

  useEffect((): void => {
    adjustHeight();
  }, [input, adjustHeight]);

  useEffect((): (() => void) => {
    return (): void => {
      console.log("[MessageComposer] Component unmounting, cleaning up");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === "Enter" && !e.shiftKey) {
        console.log("[MessageComposer] Enter key pressed");
        e.preventDefault();
        handleSendAndStopTyping();
      }
    },
    [handleSendAndStopTyping],
  );

  return (
    <footer className="p-2 md:p-3 bg-background shrink-0 border-t border-border/40 relative">
      <div className="max-w-5xl mx-auto flex flex-col min-w-0">
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 px-3 py-2 bg-muted/10 rounded-t-2xl border-l-2 border-primary/50 mx-1 mb-[-1px]"
            >
              {attachments.map((file: File, idx: number) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-2 px-2 py-1 bg-background border border-border/60 rounded-md max-w-[160px] group"
                >
                  <FileIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-[12px] truncate flex-1">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="h-4 w-4 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

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
                      : (replyingTo?.sender?.firstName ?? "User")}
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

        {showJoinButton ? (
          <div className="flex justify-center w-full px-1">
            <Button
              onClick={handleJoinClick}
              disabled={disabled}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all shadow-sm"
            >
              Join {chatType === "CHANNEL" ? "Channel" : "Group"}
            </Button>
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
        ) : !canWrite ? (
          <div className="flex items-center justify-center w-full px-4 h-11 bg-muted/30 rounded-xl border border-border/50 select-none cursor-not-allowed">
            <div className="flex items-center gap-2.5 text-muted-foreground/70">
              <Lock className="h-4 w-4" />
              <span className="text-[13.5px] font-medium tracking-wide">
                Writing messages is restricted
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-2 relative">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              onChange={handleFileChange}
            />
            <Button
              type="button"
              size="icon"
              onClick={() => {
                console.log("[MessageComposer] Attach button clicked");
                fileInputRef.current?.click();
              }}
              disabled={disabled}
              className="h-[38px] w-[38px] rounded-full shrink-0 bg-muted/40 text-muted-foreground hover:text-primary transition-colors"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            <div className="relative flex-1 min-w-0">
              <div
                className={cn(
                  "w-full rounded-[20px] bg-muted/40 border border-border/50 transition-all duration-200 focus-within:bg-muted/60 pr-1",
                  (activeAction || attachments.length > 0) &&
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
                    {(input.trim().length > 0 || attachments.length > 0) && (
                      <Button
                        type="button"
                        onClick={handleSendAndStopTyping}
                        disabled={disabled}
                        size="icon"
                        className="h-7 w-7 rounded-full bg-primary text-primary-foreground active:scale-90 transition-transform flex items-center justify-center"
                      >
                        {disabled ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowUp className="h-4 w-4" strokeWidth={3} />
                        )}
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
