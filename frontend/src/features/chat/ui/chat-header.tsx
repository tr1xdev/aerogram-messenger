import { memo, useMemo, useState, useEffect, type ReactNode } from "react";
import { graphql, useFragment } from "react-relay";
import {
  ChevronLeft,
  MoreVertical,
  Phone,
  Video,
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
import { ChatUserPopover } from "./chat-user-popover";
import type { chatHeader_user$key } from "./__generated__/chatHeader_user.graphql";

const ChatHeaderUserFragment = graphql`
  fragment chatHeader_user on User {
    id
    status
    photoUrl
    firstName
    lastName
    displayName
    isTyping
    isVerified
  }
`;

interface ChatHeaderProps {
  title?: string;
  photoUrl?: string;
  totalUnread: number;
  meId?: string;
  isLoading: boolean;
  userRef: chatHeader_user$key | null;
  type?: "DIRECT" | "PRIVATE" | "GROUP" | "CHANNEL";
  membersCount?: number;
}

export const ChatHeader = memo(function ChatHeader({
  title,
  photoUrl,
  totalUnread,
  isLoading,
  userRef,
  type = "DIRECT",
  membersCount = 0,
}: ChatHeaderProps): ReactNode {
  const navigate = useNavigate();
  const [now, setNow] = useState<number>((): number => Date.now());

  const user = useFragment(ChatHeaderUserFragment, userRef);

  const isTyping: boolean = user?.isTyping ?? false;
  const rawStatus: string = user?.status ?? "offline";
  const isOnline: boolean = useMemo(
    (): boolean => rawStatus.toLowerCase() === "online",
    [rawStatus],
  );

  useEffect((): (() => void) | void => {
    const interval: ReturnType<typeof setInterval> = setInterval((): void => {
      setNow(Date.now());
    }, 30000);
    return (): void => clearInterval(interval);
  }, []);

  const statusText: string = useMemo((): string => {
    if (type === "CHANNEL" || type === "GROUP") {
      const count: number = membersCount ?? 0;
      return `${count} ${count === 1 ? "member" : "members"}`;
    }

    if (isTyping) return "typing...";
    return formatLastSeen(rawStatus, new Date(now));
  }, [type, membersCount, isTyping, rawStatus, now]);

  const effectivePhotoUrl: string | undefined = useMemo(():
    | string
    | undefined => {
    return photoUrl || user?.photoUrl || undefined;
  }, [user?.photoUrl, photoUrl]);

  const renderContent = (): ReactNode => (
    <div className="flex items-center gap-3 overflow-hidden ml-2 md:ml-0 cursor-pointer hover:opacity-80 transition-opacity text-left">
      <UserAvatar
        src={effectivePhotoUrl}
        fallback={title || "Chat"}
        size={40}
        className="border border-border/40"
      />
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[15px] font-bold truncate leading-none">
            {title}
          </span>
          {(user?.isVerified || type === "CHANNEL") && (
            <MdVerified className="text-[#2196f3] shrink-0 text-[16px]" />
          )}
        </div>
        <span
          className={cn(
            "text-[11px] mt-1 font-medium leading-none h-3 flex items-center",
            (type === "DIRECT" || type === "PRIVATE") && (isTyping || isOnline)
              ? "text-primary"
              : "text-muted-foreground",
          )}
        >
          {statusText}
        </span>
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
              navigate({ to: "/" }).catch((): void => {});
            }}
            className="shrink-0"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          {totalUnread > 0 && (
            <span className="absolute top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold border-2 border-background px-1 z-60">
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
        ) : (type === "DIRECT" || type === "PRIVATE") && user ? (
          <ChatUserPopover userId={user.id}>{renderContent()}</ChatUserPopover>
        ) : (
          renderContent()
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
              <span>Search messages</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BellOff className="mr-2 h-4 w-4" />
              <span>Mute notifications</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Shield className="mr-2 h-4 w-4" />
              <span>Start secret chat</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Ban className="mr-2 h-4 w-4" />
              <span>Block user</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete chat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
});
