import { type ReactNode, useState, Suspense } from "react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChannelContent } from "./channel/channel-content";
import { GroupContent } from "./group/group-content";
import { UserContent } from "./user/user-content";

interface ChatEntityDetailsProps {
  id: string;
  type: "CHANNEL" | "GROUP" | "PRIVATE";
  children: ReactNode;
}

export function ChatEntityDetails({
  id,
  type,
  children,
}: ChatEntityDetailsProps): ReactNode {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center min-w-0 flex-1 h-full cursor-pointer">
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl sm:rounded-2xl bg-background outline-none h-[600px] max-h-[90vh]">
        <VisuallyHidden.Root>
          <DialogTitle>Chat Details</DialogTitle>
          <DialogDescription>
            Information and settings for this chat entity
          </DialogDescription>
        </VisuallyHidden.Root>

        <Suspense
          fallback={
            <div className="h-full w-full bg-background animate-pulse flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-muted" />
            </div>
          }
        >
          {type === "CHANNEL" && <ChannelContent id={id} />}
          {type === "GROUP" && (
            <GroupContent id={id} open={isOpen} onOpenChange={setIsOpen} />
          )}
          {type === "PRIVATE" && <UserContent id={id} />}
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
