import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";

interface BotCardProps {
  id: string;
  username?: string | null;
  firstName?: string | null;
  description?: string | null;
  photoUrl?: string | null;
}

export const BotCard: React.FC<BotCardProps> = ({
  id,
  username,
  firstName,
  description,
  photoUrl,
}): React.ReactNode => {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-4 px-5 py-5",
        "hover:bg-muted/30 cursor-pointer transition-all duration-200 relative",
      )}
      onClick={(): void => {
        navigate({ to: `/bots/${id}` }).catch((): void => {});
      }}
    >
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <UserAvatar
          src={photoUrl ?? undefined}
          fallback={firstName || "B"}
          size={40}
          className="rounded-xl border border-muted/20 shrink-0"
        />

        <div className="flex flex-col min-w-0 flex-1 relative self-stretch justify-center">
          <div className="flex items-center gap-2 leading-none">
            <span className="text-[15px] font-bold text-foreground group-hover:text-primary/90 transition-colors truncate">
              {firstName ?? "Unknown Bot"}
            </span>
            {username && (
              <span className="text-[11px] font-mono text-muted-foreground/40 font-medium tracking-tight pt-0.5 truncate">
                @{username}
              </span>
            )}
          </div>

          {description && (
            <p className="text-[13px] text-muted-foreground/80 line-clamp-1 font-medium mt-2 leading-relaxed">
              {description}
            </p>
          )}

          <div className="absolute -bottom-5 left-0 right-0 h-[1px] bg-muted/20 group-last:hidden" />
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-center">
        <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-all duration-300 group-hover:text-primary group-hover:translate-x-1" />
      </div>
    </div>
  );
};
