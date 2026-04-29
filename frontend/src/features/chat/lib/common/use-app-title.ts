import { useLayoutEffect, useRef, useMemo } from "react";
import { graphql, useFragment } from "react-relay";
import { useAuthStore } from "@/store/auth-store";
import type { useAppTitle_chats$key } from "./__generated__/useAppTitle_chats.graphql";

const FAVICON_SOURCE = "/favicon.ico";
const BADGE_COLOR = "#F44336";
const BORDER_COLOR = "#FFFFFF";

const chatsFragment = graphql`
  fragment useAppTitle_chats on ChatList {
    chats {
      unreadCount
    }
  }
`;

function updateFaviconWithBadge(count: number): void {
  const favicon: HTMLLinkElement | null =
    document.querySelector("link[rel*='icon']");
  if (!favicon) return;

  const img = new Image();
  img.src = `${FAVICON_SOURCE}?v=1`;
  img.crossOrigin = "anonymous";

  img.onload = (): void => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, 32, 32);

    if (count > 0) {
      const radius = 5;
      const x = 25;
      const y = 7;

      ctx.globalCompositeOperation = "source-over";
      ctx.beginPath();
      ctx.arc(x, y, radius + 1.5, 0, Math.PI * 2);
      ctx.fillStyle = BORDER_COLOR;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = BADGE_COLOR;
      ctx.fill();
    }

    favicon.href = canvas.toDataURL("image/png");
  };
}

export function useAppTitle(chatsRef: useAppTitle_chats$key | null): void {
  const isAuth = useAuthStore((s) => s.isAuth);
  const data = useFragment(chatsFragment, chatsRef);

  const lastCountRef = useRef<number>(0);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalUnread = useMemo((): number => {
    if (!data?.chats) return 0;
    return data.chats.reduce(
      (acc: number, chat: { readonly unreadCount: number | null } | null) =>
        acc + (chat?.unreadCount ?? 0),
      0,
    );
  }, [data]);

  useLayoutEffect((): (() => void) | void => {
    const baseTitle = "Aerogram";

    if (!isAuth) {
      document.title = baseTitle;
      updateFaviconWithBadge(0);
      return;
    }

    const displayCount: string =
      totalUnread > 99 ? "99+" : totalUnread.toString();
    const formattedTitle: string =
      totalUnread > 0 ? `(${displayCount}) ${baseTitle}` : baseTitle;

    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);

    if (
      totalUnread > lastCountRef.current &&
      totalUnread > 0 &&
      document.hidden
    ) {
      document.title = `• ${formattedTitle}`;
      flashTimerRef.current = setTimeout((): void => {
        document.title = formattedTitle;
      }, 3000);
    } else {
      document.title = formattedTitle;
    }

    updateFaviconWithBadge(totalUnread);
    lastCountRef.current = totalUnread;

    const onFocus = (): void => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      document.title = formattedTitle;
    };

    window.addEventListener("focus", onFocus);
    return (): void => {
      window.removeEventListener("focus", onFocus);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [isAuth, totalUnread]);
}
