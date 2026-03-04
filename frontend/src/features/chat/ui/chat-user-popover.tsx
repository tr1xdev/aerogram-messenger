import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_USER_BY_ID } from "@/features/chat/api/chat.gql";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/entities/chat/model/types";

interface ChatUserPopoverProps {
  userId: string;
  children: React.ReactNode;
}

export function ChatUserPopover({ userId, children }: ChatUserPopoverProps) {
  const [open, setOpen] = useState(false);
  const { data, loading, error } = useQuery<{ getUser: User }>(GET_USER_BY_ID, {
    variables: { id: userId },
    skip: !open,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

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
        ) : error || !data?.getUser ? (
          <div className="p-4 text-xs text-center text-muted-foreground">
            User information unavailable
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="h-16 bg-muted/30 w-full" />
            <div className="px-4 pb-4">
              <div className="relative -mt-8 mb-3">
                <Avatar className="h-20 w-20 border-4 border-background shadow-sm">
                  <AvatarImage src={data.getUser.photoUrl || ""} />
                  <AvatarFallback className="text-2xl font-bold bg-muted">
                    {data.getUser.first_name?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold leading-none">
                  {data.getUser.first_name} {data.getUser.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  @{data.getUser.username}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Bio
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    No bio provided yet.
                  </p>
                </div>

                <div className="pt-2 border-t border-border/40 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <span
                      className={
                        data.getUser.status === "online"
                          ? "text-primary font-medium"
                          : "text-foreground"
                      }
                    >
                      {data.getUser.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground truncate ml-4">
                      {data.getUser.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
