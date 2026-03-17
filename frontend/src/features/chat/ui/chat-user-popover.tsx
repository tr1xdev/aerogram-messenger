import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import { useNavigate } from "@tanstack/react-router";
import { MdVerified } from "react-icons/md";
import { GET_USER_BY_ID } from "@/features/chat/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/entities/chat/model/types";
import { formatLastSeen } from "@/shared/lib/date";

interface ChatUserPopoverProps {
  userId: string;
  children: React.ReactNode;
}

export function ChatUserPopover({ userId, children }: ChatUserPopoverProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = (): void => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { data, loading, error } = useQuery<{ user: User }>(GET_USER_BY_ID, {
    variables: { id: userId },
    skip: !open,
  });

  const handleTriggerClick = (e: React.MouseEvent): void => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      navigate({ to: "/user/$userId", params: { userId } });
    }
  };

  return (
    <Popover open={isMobile ? false : open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={handleTriggerClick}>
        {children}
      </PopoverTrigger>

      <PopoverContent
        className="w-72 p-0 overflow-hidden border-border/50 shadow-xl"
        align="start"
      >
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ) : error || !data?.user ? (
          <div className="p-4 text-xs text-center text-muted-foreground">
            User information unavailable
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="h-16 bg-muted/30 w-full" />
            <div className="px-4 pb-4">
              <div className="relative -mt-10 mb-3">
                {/* Fix: Added aspect-square and overflow-hidden to Avatar.
                  Used object-cover on AvatarImage to prevent shrinking/stretching.
                */}
                <Avatar className="h-20 w-20 border-4 border-background shadow-md rounded-full overflow-hidden aspect-square">
                  <AvatarImage
                    src={data.user.photoUrl || ""}
                    className="aspect-square object-cover w-full h-full"
                  />
                  <AvatarFallback className="text-2xl font-bold bg-muted h-full w-full flex items-center justify-center">
                    {(data.user.firstName ||
                      data.user.displayName)?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-lg font-bold leading-none truncate">
                    {data.user.displayName ||
                      `${data.user.firstName} ${data.user.lastName}`}
                  </h3>
                  {data.user.isVerified && (
                    <MdVerified
                      className="text-[#2196f3] shrink-0 text-[18px]"
                      title="Verified User"
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  @{data.user.username}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Bio
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {data.user.bio || "No bio provided yet."}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/40 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <span
                      className={
                        data.user.status === "online"
                          ? "text-primary font-medium"
                          : "text-foreground"
                      }
                    >
                      {formatLastSeen(data.user.status)}
                    </span>
                  </div>
                  {data.user.email && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Email</span>
                      <span className="text-foreground truncate ml-4">
                        {data.user.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
