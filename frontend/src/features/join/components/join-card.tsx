import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

interface JoinCardProps {
  title: string;
  slug: string;
  photoUrl: string | null | undefined;
  membersCount: number;
  type: string;
  isPending: boolean;
  onJoin: () => void;
  onCancel: () => void;
}

export function JoinCard({
  title,
  photoUrl,
  membersCount,
  type,
  isPending,
  onJoin,
  onCancel,
}: JoinCardProps): ReactNode {
  const isChannel: boolean = type === "CHANNEL";

  return (
    <div className="w-full h-full flex items-center justify-center p-4 min-h-[100dvh] lg:min-h-full">
      <div className="w-full max-w-[400px] flex flex-col items-center p-10 bg-card border border-border/60 rounded-[32px] shadow-sm">
        <UserAvatar
          src={photoUrl}
          fallback={title}
          size={96}
          className="mb-6 shadow-sm"
        />

        <div className="flex flex-col items-center text-center mb-8 space-y-1.5">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight line-clamp-1">
            {title}
          </h1>
          <p className="text-base text-muted-foreground">
            {membersCount} {isChannel ? "subscribers" : "members"}
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full h-12 rounded-xl font-medium text-base transition-transform active:scale-[0.98]"
            onClick={onJoin}
            disabled={isPending}
          >
            {isPending
              ? "Joining..."
              : `Join ${isChannel ? "Channel" : "Group"}`}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="w-full h-12 rounded-xl font-medium text-base text-muted-foreground hover:text-foreground transition-colors hover:bg-secondary/50"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
