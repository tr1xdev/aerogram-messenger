import { useMemo, memo, useState, type ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getUserColorInfo, type ColorInfo } from "@/lib/user-colors";

interface UserAvatarProps {
  src?: string | null;
  fallback: string;
  className?: string;
  userId?: string;
  size?: number;
  color?: string;
}

export const UserAvatar = memo(function UserAvatar({
  src,
  fallback,
  className,
  userId,
  size = 40,
  color,
}: UserAvatarProps): ReactNode {
  const [hasError, setHasError] = useState<boolean>(false);

  const { content, isEmoji } = useMemo((): {
    content: string;
    isEmoji: boolean;
  } => {
    const trimmed: string = fallback.trim() || "?";
    const segments: string[] = Array.from(trimmed);
    const firstChar: string = segments[0] || "?";

    const emojiRegex: RegExp = /\p{Extended_Pictographic}/u;
    if (emojiRegex.test(firstChar)) {
      return { content: firstChar, isEmoji: true };
    }

    const initials: string = trimmed
      .split(/\s+/)
      .filter(Boolean)
      .map((n: string): string => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return { content: initials || "?", isEmoji: false };
  }, [fallback]);

  const colorInfo: ColorInfo = useMemo(
    (): ColorInfo => getUserColorInfo(userId, fallback),
    [userId, fallback],
  );

  const containerStyle = useMemo(
    () => ({
      width: size,
      height: size,
    }),
    [size],
  );

  const fallbackStyle = useMemo(
    () => ({
      background:
        color ||
        `linear-gradient(135deg, ${colorInfo.start} 0%, ${colorInfo.end} 100%)`,
      fontSize: isEmoji ? size * 0.45 : Math.max(size * 0.38, 12),
      textShadow: isEmoji ? "none" : "0px 1px 1px rgba(0,0,0,0.15)",
    }),
    [color, colorInfo.start, colorInfo.end, isEmoji, size],
  );

  return (
    <Avatar
      className={cn(
        "shrink-0 border-none select-none relative overflow-hidden bg-muted",
        className,
      )}
      style={containerStyle}
    >
      {src && !hasError && (
        <img
          src={src}
          alt={fallback}
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover z-10"
          onError={(): void => setHasError(true)}
        />
      )}

      <div className="absolute inset-0 z-0">
        <AvatarFallback
          className={cn(
            "font-semibold text-white w-full h-full flex items-center justify-center",
            !isEmoji && "tracking-tight",
          )}
          style={fallbackStyle}
        >
          {content}
        </AvatarFallback>
      </div>
    </Avatar>
  );
});
