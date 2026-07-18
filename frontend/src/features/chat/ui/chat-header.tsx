import { useState, useEffect, type ReactNode } from "react";
import { graphql, useFragment } from "react-relay";
import {
  ChevronLeft,
  MoreVertical,
  Ban,
  BellOff,
  Search,
  Trash2,
  Shield,
} from "lucide-react";
import { MdVerified } from "react-icons/md";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatLastSeen } from "@/shared/lib/date";
import { cn } from "@/lib/utils";
import { ChatEntityDetails } from "./chat-entity-details";
import type { chatHeader_user$key } from "./__generated__/chatHeader_user.graphql";
import { useTypingSubscription } from "@/features/chat/lib/chat/use-typing";

const ChatHeaderUserFragment = graphql`
  fragment chatHeader_user on User {
    id
    status
    photoUrl
    firstName
    lastName
    displayName
    username
    isTyping
    isVerified
  }
`;

interface ChatHeaderProps {
  id: string;
  myId?: string;
  title?: string;
  photoUrl?: string;
  totalUnread: number;
  isLoading: boolean;
  userRef: chatHeader_user$key | null;
  type: "PRIVATE" | "GROUP" | "CHANNEL";
  membersCount?: number;
}

export function ChatHeader({
  id,
  myId,
  title,
  photoUrl,
  totalUnread,
  isLoading,
  userRef,
  type,
  membersCount = 0,
}: ChatHeaderProps): ReactNode {
  const navigate = useNavigate();
  const [now, setNow] = useState<number>((): number => Date.now());
  const user = useFragment(ChatHeaderUserFragment, userRef);
  const typingStatus = useTypingSubscription(id, myId, type);

  const isSavedMessages: boolean =
    type === "PRIVATE" && (title === "Saved Messages" || !userRef);
  const isTyping: boolean = (user?.isTyping ?? false) && user?.id !== myId;
  const rawStatus: string = user?.status ?? "offline";
  const isOnline: boolean = rawStatus.toLowerCase() === "online";

  useEffect((): (() => void) | void => {
    const interval: ReturnType<typeof setInterval> = setInterval((): void => {
      setNow(Date.now());
    }, 30000);
    return (): void => clearInterval(interval);
  }, []);

  const renderDots = (): ReactNode => (
    <span className="inline-flex items-center gap-0.5 ml-1 h-3 align-baseline">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </span>
  );

  let statusText: ReactNode = formatLastSeen(rawStatus, new Date(now));
  if (isSavedMessages) {
    statusText = user?.username ? `@${user.username}` : "";
  } else if (type === "CHANNEL" || type === "GROUP") {
    if (typingStatus) {
      statusText = (
        <span className="flex items-center">
          {typingStatus.text}
          {typingStatus.showDots && renderDots()}
        </span>
      );
    } else {
      statusText = `${membersCount} ${membersCount === 1 ? "member" : "members"}`;
    }
  } else if (isTyping) {
    statusText = (
      <span className="flex items-center">
        typing
        {renderDots()}
      </span>
    );
  }

  const effectivePhotoUrl: string | undefined = isSavedMessages
    ? undefined
    : photoUrl || user?.photoUrl || undefined;

  const showVerifiedBadge: boolean =
    !isSavedMessages && type === "PRIVATE" && (user?.isVerified ?? false);

  const renderInfo = (): ReactNode => (
    <div
      className={cn(
        "flex items-center gap-3 overflow-hidden ml-2 md:ml-0 text-left",
        !isSavedMessages &&
          "cursor-pointer hover:opacity-80 transition-opacity",
      )}
    >
      <UserAvatar
        src={effectivePhotoUrl}
        fallback={isSavedMessages ? "Saved Messages" : title || "Chat"}
        size={40}
        className="border border-border/40"
        isSavedMessages={isSavedMessages}
      />
      <div className="flex flex-col min-w-0 py-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[15px] font-bold truncate leading-tight">
            {isSavedMessages ? "Saved Messages" : title}
          </span>
          {showVerifiedBadge && (
            <MdVerified className="text-[#2196f3] shrink-0 text-[16px] self-center" />
          )}
        </div>
        {statusText && (
          <span
            className={cn(
              "text-[11px] mt-1 font-medium leading-none h-3 flex items-center",
              (type === "PRIVATE" && !isSavedMessages && (isTyping || isOnline)) || !!typingStatus
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            {statusText}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <header className="flex h-16 items-center justify-between px-4 border-b shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-2 min-w-0 h-full">
        <div className="relative flex items-center h-full pt-1 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={(): void => {
              void navigate({ to: "/" });
            }}
            className="shrink-0"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          {totalUnread > 0 && (
            <span className="absolute top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold border-2 border-background px-1">
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
        ) : isSavedMessages ? (
          <div>{renderInfo()}</div>
        ) : (
          <ChatEntityDetails
            id={type === "PRIVATE" ? (user?.id ?? id) : id}
            type={type}
          >
            {renderInfo()}
          </ChatEntityDetails>
        )}
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={isLoading}
              className="text-muted-foreground"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <Search className="mr-2 h-4 w-4" />
              <span className="text-xs font-bold uppercase">
                Search messages
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BellOff className="mr-2 h-4 w-4" />
              <span className="text-xs font-bold uppercase">
                Mute notifications
              </span>
            </DropdownMenuItem>
            {type === "PRIVATE" && !isSavedMessages && (
              <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" />
                <span className="text-xs font-bold uppercase">
                  Start secret chat
                </span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {!isSavedMessages && (
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Ban className="mr-2 h-4 w-4" />
                <span className="text-xs font-bold uppercase">Block</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span className="text-xs font-bold uppercase">Delete chat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
