import { useState, type ReactNode, Suspense } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserContent } from "./user-content";
import { GroupContent } from "./group-content";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatEntityDetailsProps {
  id: string;
  type: "PRIVATE" | "GROUP" | "CHANNEL";
  children: ReactNode;
}

export function ChatEntityDetails({
  id,
  type,
  children,
}: ChatEntityDetailsProps): ReactNode {
  const isMobile: boolean = useIsMobile();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const handleTriggerClick = (e: React.MouseEvent): void => {
    if (isMobile) {
      e.preventDefault();
      if (type === "PRIVATE") {
        void navigate({ to: "/users/$userId", params: { userId: id } });
      } else {
        void navigate({ to: "/chat/$chatId", params: { chatId: id } });
      }
    } else {
      setIsDialogOpen(true);
      setIsPopoverOpen(false);
    }
  };

  if (isMobile) return <div onClick={handleTriggerClick}>{children}</div>;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <DialogTrigger asChild onClick={handleTriggerClick}>
            <div className="cursor-pointer outline-none">{children}</div>
          </DialogTrigger>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          className="w-80 p-0 overflow-hidden border-border/50 shadow-2xl"
        >
          <Suspense fallback={<EntitySkeleton />}>
            {type === "PRIVATE" ? (
              <UserContent userId={id} isPreview />
            ) : (
              <GroupContent id={id} isPreview />
            )}
          </Suspense>
        </PopoverContent>
      </Popover>

      <DialogContent className="max-w-[480px] p-0 overflow-hidden border-none shadow-2xl bg-background">
        <VisuallyHidden>
          <DialogTitle>
            {type === "PRIVATE" ? "User Profile" : "Group Details"}
          </DialogTitle>
          <DialogDescription>
            Detailed information about the selected entity
          </DialogDescription>
        </VisuallyHidden>
        <Suspense fallback={<EntitySkeleton />}>
          {type === "PRIVATE" ? (
            <UserContent userId={id} />
          ) : (
            <GroupContent id={id} />
          )}
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}

function EntitySkeleton(): ReactNode {
  return (
    <div className="flex flex-col w-full">
      <Skeleton className="h-24 w-full rounded-none" />
      <div className="p-5 space-y-4">
        <Skeleton className="h-20 w-20 rounded-full -mt-12 border-4 border-background" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
