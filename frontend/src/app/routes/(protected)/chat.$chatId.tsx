import { useRef, useLayoutEffect, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useChatStore } from "@/store/chat";
import { useChatSubscriptionWrapper } from "@/features/chat/lib/hooks";
import {
  useChatHistory,
  useChatActions,
  useMe,
  useChatDetails,
} from "@/features/chat/lib/use-messages";
import { cn } from "@/lib/utils";
import type { Message } from "@/entities/chat/model/types";

function ChatPage() {
  const { chatId } = Route.useParams();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { input, setInput, resetInput } = useChatStore();
  const { data: me } = useMe();
  const { data: chat, isLoading: chatLoading } = useChatDetails(chatId);
  const { data: messages, isLoading: msgsLoading } = useChatHistory(chatId);
  const { sendMessage, isSending } = useChatActions(chatId);
  useChatSubscriptionWrapper(chatId);

  const sortedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
    );
  }, [messages]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [sortedMessages.length]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    await sendMessage(input, { onSuccess: () => resetInput() });
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      <header className="flex h-14 items-center justify-between px-4 border-b shrink-0 bg-background/95 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/" })}
            className="h-8 w-8 md:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {chatLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : (
            <div className="flex items-center gap-3 overflow-hidden">
              <Avatar className="h-8 w-8 border">
                <AvatarImage src={chat?.photoUrl || ""} />
                <AvatarFallback className="text-xs font-bold bg-muted">
                  {chat?.title?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate min-w-0">
                <span className="text-sm font-semibold truncate">
                  {chat?.title}
                </span>
              </div>
            </div>
          )}
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 min-h-0 relative overflow-hidden">
        <ScrollArea ref={scrollRef} className="h-full w-full">
          <div className="p-4 pb-24 space-y-4">
            {msgsLoading
              ? Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex gap-3",
                        i % 2 === 0 ? "flex-row-reverse" : "flex-row",
                      )}
                    >
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <Skeleton className="h-10 w-40 rounded-xl" />
                    </div>
                  ))
              : sortedMessages.map((msg: Message) => {
                  const isMe = msg.sender.id === me?.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex w-full",
                        isMe ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "flex gap-2 max-w-[80%]",
                          isMe ? "flex-row-reverse" : "flex-row",
                        )}
                      >
                        <div
                          className={cn(
                            "flex flex-col",
                            isMe ? "items-end" : "items-start",
                          )}
                        >
                          <div
                            className={cn(
                              "px-3 py-1.5 text-sm rounded-2xl border shadow-sm break-words whitespace-pre-wrap",
                              isMe
                                ? "bg-primary text-primary-foreground border-transparent rounded-tr-none"
                                : "bg-muted text-foreground rounded-tl-none",
                            )}
                          >
                            {msg.text}
                          </div>
                          <span className="text-xs text-muted-foreground mt-1 px-1">
                            {new Date(msg.sentAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
        </ScrollArea>
      </div>

      <footer className="p-4 border-t bg-background shrink-0 z-20">
        <form
          className="flex gap-2 max-w-4xl mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Input
            placeholder="Message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={msgsLoading}
            className="flex-1 rounded-xl h-10 bg-muted/50 border-none focus-visible:ring-1 px-4"
          />
          <Button
            type="submit"
            disabled={isSending || !input.trim() || msgsLoading}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
}

export const Route = createFileRoute("/(protected)/chat/$chatId")({
  component: ChatPage,
});
