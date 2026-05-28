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
import { X, ArrowUp, Paperclip, Lock, FileIcon, Loader2 } from "lucide-react";
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
  myRole?: string;
  permissions?: {
    canSendMessage: boolean;
    canInviteUsers: boolean;
    canEditMetadata: boolean;
    canDeleteMessages: boolean;
    canAssignAdmins: boolean;
  };
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
  myRole,
  permissions,
}: MessageComposerProps): ReactNode {
  const [attachments, setAttachments] = useState<File[]>([]);
  const activeAction: Message | null = editingMessage || replyingTo;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef<boolean>(false);

  useEffect((): void => {
    console.log("DEBUG: MessageComposer state", {
      canWrite,
      myRole,
      isMember,
      permissions,
    });
  }, [canWrite, myRole, isMember, permissions]);

  const showStartButton: boolean = useMemo((): boolean => {
    return (
      isBot &&
      chatType === "PRIVATE" &&
      isEmpty &&
      !editingMessage &&
      !replyingTo &&
      attachments.length === 0
    );
  }, [
    isBot,
    chatType,
    isEmpty,
    editingMessage,
    replyingTo,
    attachments.length,
  ]);

  const showJoinButton: boolean = useMemo((): boolean => {
    return !isMember && (chatType === "CHANNEL" || chatType === "GROUP");
  }, [isMember, chatType]);

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

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>): void => {
      const value: string = e.target.value;
      setInput(value);
      adjustHeight();

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
    [setInput, onTyping, stopTyping, adjustHeight],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      if (e.target.files) {
        const newFiles: File[] = Array.from(e.target.files);
        setAttachments((prev: File[]) => [...prev, ...newFiles]);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [],
  );

  const removeAttachment = useCallback((index: number): void => {
    setAttachments((prev: File[]): File[] =>
      prev.filter((_, i: number): boolean => i !== index),
    );
  }, []);

  const handleSendAndStopTyping = useCallback((): void => {
    if (disabled || !canWrite) return;
    if (input.trim().length === 0 && attachments.length === 0) return;

    stopTyping();
    onSend(input, attachments);
    setAttachments([]);
  }, [onSend, stopTyping, disabled, canWrite, input, attachments]);

  const handleStartBot = useCallback((): void => {
    onSend("/start");
  }, [onSend]);

  const handleJoinClick = useCallback((): void => {
    if (!onJoin || disabled) return;
    onJoin();
  }, [onJoin, disabled]);

  useEffect((): void => {
    if (activeAction) {
      textareaRef.current?.focus();
    }
  }, [activeAction]);

  useEffect((): void => {
    adjustHeight();
  }, [input, adjustHeight]);

  useEffect((): (() => void) => {
    const timeoutId: ReturnType<typeof setTimeout> | null =
      typingTimeoutRef.current;
    return (): void => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendAndStopTyping();
      }
    },
    [handleSendAndStopTyping],
  );

  const senderName = useMemo((): string => {
    if (!replyingTo?.sender) return "User";
    const { firstName, lastName } = replyingTo.sender;
    return lastName ? `${firstName} ${lastName}` : firstName;
  }, [replyingTo]);

  const actionTextInfo = useMemo((): {
    text: string;
    isPlaceholder: boolean;
  } => {
    if (!activeAction) return { text: "", isPlaceholder: false };

    const hasContent: boolean =
      typeof activeAction.text === "string" &&
      activeAction.text.trim().length > 0;
    if (hasContent) {
      return { text: activeAction.text as string, isPlaceholder: false };
    }

    return { text: "Attachment", isPlaceholder: true };
  }, [activeAction]);

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
              {attachments.map(
                (file: File, idx: number): ReactNode => (
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
                      onClick={(): void => removeAttachment(idx)}
                      className="h-4 w-4 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ),
              )}
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
              onClick={(): void => fileInputRef.current?.click()}
              disabled={disabled}
              className="h-[38px] w-[38px] rounded-full shrink-0 bg-muted/40 text-muted-foreground hover:text-primary transition-colors"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            <div className="relative flex-1 min-w-0">
              <div
                className={cn(
                  "w-full rounded-[20px] bg-muted/40 border border-border/50 transition-all duration-200 focus-within:bg-muted/60 pr-1 flex flex-col overflow-hidden",
                  attachments.length > 0 &&
                    "rounded-tl-none rounded-tr-none border-t-transparent",
                )}
              >
                <AnimatePresence>
                  {activeAction && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{
                        duration: 0.1,
                        ease: "linear",
                      }}
                      className="flex items-center gap-3 pt-2 pb-1 pr-4 pl-4 relative min-w-0"
                    >
                      <div
                        className={cn(
                          "absolute left-4 top-2 bottom-1 w-[3px] rounded-full",
                          replyingTo ? "bg-sky-500" : "bg-primary",
                        )}
                      />
                      <div className="flex-1 min-w-0 ml-3">
                        <span
                          className={cn(
                            "text-[12px] font-semibold truncate block leading-tight",
                            replyingTo ? "text-sky-500" : "text-primary",
                          )}
                        >
                          {editingMessage
                            ? "Edit Message"
                            : `Reply to ${senderName}`}
                        </span>
                        <span
                          className={cn(
                            "text-[13px] truncate block leading-tight mt-0.5",
                            actionTextInfo.isPlaceholder
                              ? "text-zinc-500/80 italic font-normal"
                              : "text-white",
                          )}
                        >
                          {actionTextInfo.text}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onCancelAction}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors text-muted-foreground shrink-0"
                      >
                        <X className="h-[18px] w-[18px]" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-end w-full">
                  <textarea
                    ref={textareaRef}
                    placeholder="Message"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    rows={1}
                    className="flex-1 resize-none bg-transparent px-4 py-[9px] text-[15px] focus:outline-none max-h-[200px] overflow-y-auto leading-[20px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
