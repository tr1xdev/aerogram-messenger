import {
  useState,
  useEffect,
  type ReactNode,
  Suspense,
  type MouseEvent,
} from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { useNavigate } from "@tanstack/react-router";
import { MdVerified } from "react-icons/md";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatLastSeen } from "@/shared/lib/date";
import { cn } from "@/lib/utils";
import type { chatUserPopoverQuery } from "./__generated__/chatUserPopoverQuery.graphql";

interface ChatUserPopoverProps {
  userId: string;
  children: ReactNode;
}

const UserQuery = graphql`
  query chatUserPopoverQuery($id: ID!) {
    user(id: $id) {
      id
      username
      firstName
      lastName
      displayName
      photoUrl
      isVerified
      isBot
      botDescription
      bio
      status
      email
    }
  }
`;

export function ChatUserPopover({
  userId,
  children,
}: ChatUserPopoverProps): ReactNode {
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = (): void => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleTriggerClick = (e: MouseEvent<HTMLButtonElement>): void => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      void navigate({ to: "/users/$userId", params: { userId } });
    }
  };

  return (
    <Popover open={!isMobile && open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={handleTriggerClick}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 overflow-hidden border-border/50 shadow-2xl"
        align="start"
        sideOffset={8}
      >
        <Suspense fallback={<PopoverSkeleton />}>
          {open && <PopoverContentInner userId={userId} />}
        </Suspense>
      </PopoverContent>
    </Popover>
  );
}

function PopoverContentInner({ userId }: { userId: string }): ReactNode {
  const data = useLazyLoadQuery<chatUserPopoverQuery>(
    UserQuery,
    { id: userId },
    { fetchPolicy: "store-or-network" },
  );

  const user = data?.user;

  if (!user) {
    return (
      <div className="p-6 text-sm text-center text-muted-foreground">
        User not found
      </div>
    );
  }

  const isOnline: boolean = user.status?.toLowerCase() === "online";
  const initials: string = (
    user.displayName?.[0] ??
    user.firstName?.[0] ??
    "?"
  ).toUpperCase();

  const descriptionLabel: string = user.isBot ? "Description" : "Bio";
  const descriptionText: string = user.isBot
    ? user.botDescription || "No description provided."
    : user.bio || "This user hasn't set a bio yet.";

  return (
    <div className="flex flex-col">
      <div className="h-20 bg-gradient-to-br from-muted/50 to-muted/20 w-full" />
      <div className="px-5 pb-5">
        <div className="relative -mt-10 mb-4">
          <Avatar className="h-20 w-20 border-4 border-background shadow-lg rounded-full overflow-hidden">
            <AvatarImage src={user.photoUrl ?? ""} className="object-cover" />
            <AvatarFallback className="text-2xl font-black bg-accent text-accent-foreground uppercase">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-xl font-heavy leading-none truncate">
              {user.displayName || `${user.firstName} ${user.lastName}`}
            </h3>

            {user.isBot && (
              <span className="bg-primary/10 text-primary text-[10px] font-black px-1.5 py-0.5 rounded sm:ml-0.5">
                BOT
              </span>
            )}

            {user.isVerified && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      tabIndex={-1}
                      className="cursor-default outline-none"
                      onPointerDown={(e: MouseEvent<HTMLButtonElement>): void =>
                        e.preventDefault()
                      }
                    >
                      <MdVerified className="text-[#2196f3] shrink-0 text-xl" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="text-[11px] font-bold bg-foreground text-background"
                  >
                    Verified Account
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            @{user.username}
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-primary">
              {descriptionLabel}
            </p>
            <p className="text-[13px] leading-snug text-foreground/80 font-medium">
              {descriptionText}
            </p>
          </div>

          <div className="pt-3 border-t border-border/40 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-muted-foreground/70 uppercase tracking-tighter">
                Status
              </span>
              <span
                className={cn(
                  "font-bold px-2 py-0.5 rounded-full text-[10px] uppercase",
                  isOnline
                    ? "bg-green-500/10 text-green-500"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {formatLastSeen(user.status)}
              </span>
            </div>
            {user.email && !user.isBot && (
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-muted-foreground/70 uppercase tracking-tighter">
                  Email
                </span>
                <span className="text-foreground font-semibold truncate ml-6">
                  {user.email}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PopoverSkeleton(): ReactNode {
  return (
    <div className="flex flex-col w-full">
      <Skeleton className="h-20 w-full rounded-none" />
      <div className="px-5 pb-5">
        <div className="relative -mt-10 mb-4">
          <Skeleton className="h-20 w-20 rounded-full border-4 border-background" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="pt-3 border-t border-border/40 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
