import { ChevronLeft, MoreVertical, Phone, Video } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatLastSeen } from "@/shared/lib/date";
import { cn } from "@/lib/utils";
import type { ChatMember } from "@/entities/chat/model/types";
import { ChatUserPopover } from "./chat-user-popover";

interface ChatHeaderProps {
  title?: string;
  photoUrl?: string;
  status?: string;
  totalUnread: number;
  members?: ChatMember[];
  meId?: string;
  isLoading?: boolean;
}

export function ChatHeader({
  title,
  photoUrl,
  totalUnread,
  members,
  meId,
  isLoading,
}: ChatHeaderProps) {
  const navigate = useNavigate();
  const otherMember = members?.find((m) => m.user.id !== meId);
  const status = otherMember?.user.status;

  return (
    <header className="flex h-16 items-center justify-between px-4 border-b shrink-0 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-2 min-w-0 h-full">
        <div className="relative flex items-center h-full pt-1 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/" })}
            className="shrink-0"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          {totalUnread > 0 && (
            <span className="absolute top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold border-2 border-background px-1 shadow-sm z-[60]">
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
        ) : title ? (
          otherMember ? (
            <ChatUserPopover userId={otherMember.user.id}>
              <div className="flex items-center gap-3 overflow-hidden ml-2 md:ml-0 cursor-pointer hover:opacity-80 transition-opacity">
                <Avatar className="h-10 w-10 border border-border/50 shadow-sm">
                  <AvatarImage src={photoUrl || ""} />
                  <AvatarFallback className="font-bold bg-primary/5 text-primary text-xs">
                    {title?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 text-left">
                  <span className="text-[15px] font-bold truncate leading-none">
                    {title}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] mt-1 font-medium",
                      status === "online"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {status ? formatLastSeen(status) : "Offline"}
                  </span>
                </div>
              </div>
            </ChatUserPopover>
          ) : (
            <div className="flex items-center gap-3 overflow-hidden ml-2 md:ml-0">
              <Avatar className="h-10 w-10 border border-border/50 shadow-sm">
                <AvatarImage src={photoUrl || ""} />
                <AvatarFallback className="font-bold bg-primary/5 text-primary text-xs">
                  {title?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-[15px] font-bold truncate leading-none">
                  {title}
                </span>
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center gap-3 ml-2 md:ml-0 opacity-40 grayscale">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          disabled={isLoading || !title}
          className="hidden sm:flex text-muted-foreground hover:text-foreground"
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={isLoading || !title}
          className="hidden sm:flex text-muted-foreground hover:text-foreground"
        >
          <Video className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={isLoading || !title}
          className="text-muted-foreground hover:text-foreground"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
