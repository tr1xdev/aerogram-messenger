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
import { ChannelContent } from "./channel-content";
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

  const renderContent = (isPreview: boolean = false): ReactNode => {
    if (type === "PRIVATE")
      return <UserContent userId={id} isPreview={isPreview} />;
    if (type === "CHANNEL")
      return <ChannelContent id={id} isPreview={isPreview} />;
    return <GroupContent id={id} isPreview={isPreview} />;
  };

  if (isMobile) {
    return (
      <div onClick={handleTriggerClick} className="cursor-pointer">
        {children}
      </div>
    );
  }

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open: boolean): void => {
        setIsDialogOpen(open);
      }}
    >
      <Popover
        open={isPopoverOpen}
        onOpenChange={(open: boolean): void => {
          setIsPopoverOpen(open);
        }}
      >
        <PopoverTrigger asChild>
          <DialogTrigger asChild onClick={handleTriggerClick}>
            <div
              className="cursor-pointer outline-none"
              onContextMenu={(e: React.MouseEvent): void => {
                e.preventDefault();
                setIsPopoverOpen(true);
              }}
            >
              {children}
            </div>
          </DialogTrigger>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          className="w-80 p-0 overflow-hidden border-border/50 shadow-2xl max-h-[500px] flex flex-col bg-background"
        >
          <Suspense fallback={<EntitySkeleton />}>
            <div className="flex-1 overflow-hidden">{renderContent(true)}</div>
          </Suspense>
        </PopoverContent>
      </Popover>

      <DialogContent className="max-w-[480px] w-[95vw] p-0 overflow-hidden border-none shadow-2xl bg-background flex flex-col h-fit max-h-[90vh]">
        <VisuallyHidden>
          <DialogTitle>
            {type === "PRIVATE"
              ? "User Profile"
              : type === "CHANNEL"
                ? "Channel Details"
                : "Group Details"}
          </DialogTitle>
          <DialogDescription>
            Detailed information about the selected entity
          </DialogDescription>
        </VisuallyHidden>

        <Suspense fallback={<EntitySkeleton />}>
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {renderContent(false)}
          </div>
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
        <Skeleton className="h-16 w-16 rounded-3xl -mt-12 border-4 border-background" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}
