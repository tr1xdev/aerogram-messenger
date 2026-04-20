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

const COLORS: string[][] = [
  ["#ff516a", "#ff885e"], // red
  ["#55d067", "#a4e063"], // green
  ["#ffa85c", "#ffcd6a"], // orange
  ["#2a9ef1", "#72d5fd"], // light blue
  ["#665fff", "#82b1ff"], // blue
  ["#8d61ee", "#c382f3"], // purple
  ["#f65a92", "#f999b0"], // pink
];

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

  const { content, isEmoji } = useMemo((): {
    content: string;
    isEmoji: boolean;
  } => {
    const trimmed = fallback.trim() || "?";
    const emojiRegex =
      /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
    const segments = Array.from(trimmed);
    const firstChar = segments[0];

    if (emojiRegex.test(firstChar)) {
      return { content: firstChar, isEmoji: true };
    }

    const initials = trimmed
      .split(/\s+/)
      .map((n: string): string => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return { content: initials, isEmoji: false };
  }, [fallback]);

  const gradientStyle = useMemo((): { background: string } => {
    let hash = 0;
    const key = fallback || "default";
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COLORS.length;
    const [start, end] = COLORS[index];

    return {
      background: `linear-gradient(135deg, ${start} 0%, ${end} 100%)`,
    };
  }, [fallback]);

  return (
    <Avatar
      className={cn("shrink-0 border-none", className)}
      style={{ width: size, height: size }}
    >
      <AvatarImage
        src={stableSrc}
        alt={fallback}
        className="aspect-square object-cover"
      />
      <AvatarFallback
        className={cn(
          "select-none font-semibold text-white",
          !isEmoji && "tracking-tight",
        )}
        style={{
          ...gradientStyle,
          fontSize: isEmoji ? size * 0.45 : Math.max(size * 0.38, 12),
          color: "#FFFFFF",
          textShadow: isEmoji ? "none" : "0px 1px 1px rgba(0,0,0,0.12)",
        }}
      >
        {content}
      </AvatarFallback>
    </Avatar>
  );
}
