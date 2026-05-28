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
  error?: string | null;
  onJoin: () => void;
  onCancel: () => void;
}

export function JoinCard({
  title,
  slug,
  photoUrl,
  membersCount,
  type,
  isPending,
  error,
  onJoin,
  onCancel,
}: JoinCardProps): ReactNode {
  const isChannel: boolean = type === "CHANNEL";

  return (
    <div className="w-full h-full flex items-center justify-center p-4 min-h-[100dvh] lg:min-h-full">
      <div className="w-full max-w-[400px] flex flex-col items-center p-10 bg-card border border-border/60 rounded-[32px] shadow-sm animate-in fade-in zoom-in-95 duration-300">
        <UserAvatar
          src={photoUrl}
          fallback={title}
          size={96}
          className="mb-6 shadow-md ring-4 ring-secondary/30"
        />

        <div className="flex flex-col items-center text-center mb-8 space-y-1">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight line-clamp-1 px-2">
            {title}
          </h1>
          <p className="text-base text-muted-foreground">
            {membersCount.toLocaleString()}{" "}
            {isChannel ? "subscribers" : "members"}
          </p>
          {slug && <p className="text-sm text-primary font-medium">@{slug}</p>}
        </div>

        {error && (
          <div className="w-full mb-6 p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium text-center animate-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          <Button
            size="lg"
            className="group relative w-full h-12 rounded-xl font-medium text-base overflow-hidden transition-all active:scale-[0.98] bg-primary text-primary-foreground"
            onClick={onJoin}
            disabled={isPending}
          >
            {!isPending && <div className="shimmer-effect" />}
            <span className="relative z-10">
              {isPending
                ? "Joining..."
                : `Join ${isChannel ? "Channel" : "Group"}`}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="w-full h-12 rounded-xl font-medium text-base text-muted-foreground hover:text-foreground transition-colors"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
