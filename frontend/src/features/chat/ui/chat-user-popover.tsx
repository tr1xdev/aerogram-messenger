import { useState, useEffect } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { useNavigate } from "@tanstack/react-router";
import { MdVerified } from "react-icons/md";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatLastSeen } from "@/shared/lib/date";
import type { chatUserPopoverQuery } from "./__generated__/chatUserPopoverQuery.graphql";

interface ChatUserPopoverProps {
  userId: string;
  children: React.ReactNode;
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
      bio
      status
      email
    }
  }
`;

function PopoverContentInner({ userId }: { userId: string }): React.ReactNode {
  const data = useLazyLoadQuery<chatUserPopoverQuery>(
    UserQuery,
    { id: userId },
    { fetchPolicy: "store-or-network" },
  );

  const user = data?.user;

  if (!user) {
    return (
      <div className="p-4 text-xs text-center text-muted-foreground">
        User information unavailable
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="h-16 bg-muted/30 w-full" />
      <div className="px-4 pb-4">
        <div className="relative -mt-10 mb-3">
          <Avatar className="h-20 w-20 border-4 border-background shadow-md rounded-full overflow-hidden aspect-square">
            <AvatarImage
              src={user.photoUrl || ""}
              className="aspect-square object-cover w-full h-full"
            />
            <AvatarFallback className="text-2xl font-bold bg-muted h-full w-full flex items-center justify-center">
              {(user.firstName || user.displayName)?.[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-lg font-bold leading-none truncate">
              {user.displayName || `${user.firstName} ${user.lastName}`}
            </h3>
            {user.isVerified && (
              <MdVerified
                className="text-[#2196f3] shrink-0 text-[18px]"
                title="Verified User"
              />
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>

        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Bio
            </p>
            <p className="text-sm leading-relaxed text-foreground/90">
              {user.bio || "No bio provided yet."}
            </p>
          </div>

          <div className="pt-2 border-t border-border/40 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Status</span>
              <span
                className={
                  user.status === "online"
                    ? "text-primary font-medium"
                    : "text-foreground"
                }
              >
                {formatLastSeen(user.status)}
              </span>
            </div>
            {user.email && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground truncate ml-4">
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

export function ChatUserPopover({ userId, children }: ChatUserPopoverProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect((): (() => void) => {
    const checkMobile = (): void => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return (): void => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleTriggerClick = (e: React.MouseEvent): void => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      navigate({ to: "/users/$userId", params: { userId } }).catch(
        (): void => {},
      );
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
        {open && <PopoverContentInner userId={userId} />}
      </PopoverContent>
    </Popover>
  );
}
