import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, MoreVertical, Phone, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatLastSeen } from "@/shared/lib/date";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChatUserPopover } from "./chat-user-popover";
import type { ChatMember } from "@/entities/chat/model/types";

interface ChatHeaderProps {
  title?: string;
  photoUrl?: string;
  totalUnread: number;
  members?: ChatMember[];
  meId?: string;
  chatId: string;
}

export function ChatHeader({
  title,
  photoUrl,
  totalUnread,
  members,
  meId,
}: ChatHeaderProps) {
  const navigate = useNavigate();
  const otherMember = members?.find((m) => m.user.id !== meId)?.user;

  return (
    <header className="flex items-center justify-between px-4 h-16 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3 overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden rounded-full shrink-0"
          onClick={() => navigate({ to: "/" })}
        >
          <div className="relative">
            <ChevronLeft className="h-6 w-6" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>
        </Button>

        <ChatUserPopover userId={otherMember?.id || ""}>
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden">
            <Avatar className="h-10 w-10 shrink-0 border border-border/50">
              <AvatarImage src={photoUrl || otherMember?.photoUrl || ""} />
              <AvatarFallback className="font-bold bg-muted text-[10px]">
                {title?.[0] || otherMember?.first_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 text-left">
              <h2 className="text-sm font-bold truncate tracking-tight">
                {title ||
                  `${otherMember?.first_name} ${otherMember?.last_name}`}
              </h2>
              <span className="text-[11px] text-primary font-medium">
                {otherMember?.status === "online"
                  ? "online"
                  : otherMember?.lastSeen
                    ? formatLastSeen(otherMember.lastSeen)
                    : "offline"}
              </span>
            </div>
          </div>
        </ChatUserPopover>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:flex rounded-full text-muted-foreground"
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:flex rounded-full text-muted-foreground"
        >
          <Video className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
