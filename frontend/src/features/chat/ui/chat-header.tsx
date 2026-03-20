import { memo, useMemo, useState, useEffect, type ReactNode } from "react";
import { ChevronLeft, MoreVertical, Phone, Video } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatLastSeen } from "@/shared/lib/date";
import { cn } from "@/lib/utils";
import { differenceInMinutes } from "date-fns";
import type { ChatMember, User } from "@/entities/chat/model/types";
import { ChatUserPopover } from "./chat-user-popover";

interface TypingUser extends User {
  isTyping?: boolean;
}

interface ChatHeaderProps {
  title?: string;
  photoUrl?: string;
  totalUnread: number;
  members?: ChatMember[];
  meId?: string;
  isLoading: boolean;
  typingUser?: TypingUser;
}

export const ChatHeader = memo(function ChatHeader({
  title,
  photoUrl,
  totalUnread,
  members,
  meId,
  isLoading,
  typingUser,
}: ChatHeaderProps): ReactNode {
  const navigate = useNavigate();
  const [now, setNow] = useState<number>(() => Date.now());

  const otherMember: ChatMember | undefined = useMemo(
    (): ChatMember | undefined =>
      members?.find((m: ChatMember): boolean => m.user.id !== meId),
    [members, meId],
  );

  const rawStatus: string | undefined = otherMember?.user.status;

  const isTyping: boolean = useMemo((): boolean => {
    const memberId: string | undefined = otherMember?.user.id;
    if (typingUser && memberId && typingUser.id === memberId) {
      return typingUser.isTyping !== false;
    }
    return rawStatus === "typing";
  }, [typingUser, otherMember, rawStatus]);

  useEffect((): (() => void) => {
    if (
      rawStatus &&
      rawStatus !== "online" &&
      rawStatus !== "offline" &&
      !isTyping
    ) {
      const date = new Date(rawStatus);
      const diffMin: number = differenceInMinutes(new Date(), date);

      const intervalTime: number = diffMin < 1 ? 1000 : 60000;

      const interval = setInterval((): void => {
        setNow(Date.now());
      }, intervalTime);

      return (): void => clearInterval(interval);
    }
    return (): void => {};
  }, [rawStatus, isTyping, now]);

  const statusText: string = useMemo((): string => {
    if (isTyping) return "typing";
    if (rawStatus === "online") return "online";
    if (!rawStatus || rawStatus === "offline") return "offline";

    return formatLastSeen(rawStatus, new Date(now));
  }, [rawStatus, isTyping, now]);

  const effectivePhotoUrl: string | undefined =
    photoUrl ?? otherMember?.user.photoUrl ?? undefined;

  return (
    <header className="flex h-16 items-center justify-between px-4 border-b shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-2 min-w-0 h-full">
        <div className="relative flex items-center h-full pt-1 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={(): Promise<void> => navigate({ to: "/" })}
            className="shrink-0"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          {totalUnread > 0 && (
            <span className="absolute top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold border-2 border-background px-1 shadow-sm z-60">
              {totalUnread}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 ml-2 md:ml-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ) : otherMember ? (
          <ChatUserPopover userId={otherMember.user.id}>
            <div className="flex items-center gap-3 overflow-hidden ml-2 md:ml-0 cursor-pointer hover:opacity-80 transition-opacity text-left">
              <Avatar className="h-10 w-10 border border-border/50 shadow-sm rounded-full overflow-hidden shrink-0">
                {effectivePhotoUrl && (
                  <AvatarImage
                    src={effectivePhotoUrl}
                    alt={title || "Chat"}
                    className="aspect-square h-full w-full object-cover"
                  />
                )}
                <AvatarFallback className="font-bold bg-primary/5 text-primary text-xs h-full w-full flex items-center justify-center uppercase">
                  {title?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[15px] font-bold truncate leading-none">
                    {title}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-[11px] mt-1 font-medium leading-none transition-colors duration-200 h-3 flex items-center",
                    isTyping || rawStatus === "online"
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {isTyping ? (
                    <div className="flex items-center gap-0.5">
                      <div className="flex gap-[1.5px] mr-1">
                        <span className="w-1 h-1 rounded-full bg-current animate-pulse [animation-duration:1s]" />
                        <span className="w-1 h-1 rounded-full bg-current animate-pulse [animation-duration:1s] [animation-delay:200ms]" />
                        <span className="w-1 h-1 rounded-full bg-current animate-pulse [animation-duration:1s] [animation-delay:400ms]" />
                      </div>
                      <span>typing</span>
                    </div>
                  ) : (
                    statusText
                  )}
                </span>
              </div>
            </div>
          </ChatUserPopover>
        ) : (
          <div className="flex items-center gap-3 overflow-hidden ml-2 md:ml-0">
            <Avatar className="h-10 w-10 border border-border/50 shadow-sm rounded-full overflow-hidden shrink-0">
              {effectivePhotoUrl && (
                <AvatarImage
                  src={effectivePhotoUrl}
                  alt={title || "Chat"}
                  className="aspect-square h-full w-full object-cover"
                />
              )}
              <AvatarFallback className="font-bold bg-primary/5 text-primary text-xs h-full w-full flex items-center justify-center uppercase">
                {title?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-[15px] font-bold truncate leading-none">
                {title}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          disabled={isLoading}
          className="hidden sm:flex text-muted-foreground"
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={isLoading}
          className="hidden sm:flex text-muted-foreground"
        >
          <Video className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={isLoading}
          className="text-muted-foreground"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
});
