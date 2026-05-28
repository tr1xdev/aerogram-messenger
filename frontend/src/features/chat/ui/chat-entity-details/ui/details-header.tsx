import { type ReactNode } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";

interface DetailsHeaderProps {
  title: string;
  slug?: string | null;
  photoUrl?: string | null;
  subtext: string;
  badge: string;
}

export function DetailsHeader({
  title,
  slug,
  photoUrl,
  subtext,
  badge,
}: DetailsHeaderProps): ReactNode {
  return (
    <>
      <div className="relative h-32 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent shrink-0">
        <div className="absolute inset-0 bg-grid-white/5 opacity-30" />
      </div>
      <div className="px-6 -mt-12 relative z-10 shrink-0">
        <div className="flex items-end gap-4">
          <UserAvatar
            src={photoUrl ?? null}
            fallback={title}
            size={96}
            className="h-24 w-24 border-[4px] border-background shadow-xl rounded-[32px] shrink-0 object-cover"
          />
          <div className="mb-1 min-w-0 flex-1">
            <h3 className="text-xl font-bold tracking-tight text-foreground truncate">
              {title}
            </h3>
            {slug && (
              <p className="text-sm font-medium text-primary">@{slug}</p>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant="secondary"
                className="h-4 text-[9px] uppercase font-bold px-1.5"
              >
                {badge}
              </Badge>
              <p className="text-xs font-medium text-muted-foreground">
                {subtext}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
