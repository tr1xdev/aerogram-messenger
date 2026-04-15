import { useState, useMemo, type ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  fallback: string;
  className?: string;
  userId?: string;
  size?: number;
}

export function UserAvatar({
  src,
  fallback,
  className,
  size = 40,
}: UserAvatarProps): ReactNode {
  const pureSrc: string | undefined = useMemo((): string | undefined => {
    if (!src) return undefined;
    try {
      const url = new URL(src);
      return `${url.origin}${url.pathname}`;
    } catch {
      return src;
    }
  }, [src]);

  const [stableSrc, setStableSrc] = useState<string | undefined>(
    src ?? undefined,
  );

  const prevPureSrc = useMemo((): string | undefined => {
    if (!stableSrc) return undefined;
    try {
      const url = new URL(stableSrc);
      return `${url.origin}${url.pathname}`;
    } catch {
      return stableSrc;
    }
  }, [stableSrc]);

  if (src && pureSrc !== prevPureSrc) {
    setStableSrc(src);
  } else if (!src && stableSrc !== undefined) {
    setStableSrc(undefined);
  }

  const initials: string = useMemo((): string => {
    return fallback
      .trim()
      .split(/\s+/)
      .map((n: string): string => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [fallback]);

  return (
    <Avatar
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <AvatarImage
        src={stableSrc}
        alt={fallback}
        style={{ objectFit: "cover" }}
      />
      <AvatarFallback
        className="select-none"
        style={{ fontSize: Math.max(size * 0.4, 12) }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
