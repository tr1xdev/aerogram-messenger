import { useLayoutEffect, useRef, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { useAuthStore } from "@/store/auth-store";
import { GET_MY_CHATS } from "@/features/chat/api";
import type { Chat } from "@/entities/chat/model/types";

interface GetChatsData {
  myChats: {
    __typename?: string;
    chats: Chat[];
  };
}

const FAVICON_SOURCE: string = "/favicon.ico";
const BADGE_COLOR: string = "#F44336";
const BORDER_COLOR: string = "#FFFFFF";

function updateFaviconWithBadge(count: number): void {
  const favicon: HTMLLinkElement | null =
    document.querySelector("link[rel*='icon']");
  if (!favicon) return;

  const img: HTMLImageElement = new Image();
  img.src = `${FAVICON_SOURCE}?v=1`;
  img.crossOrigin = "anonymous";

  img.onload = (): void => {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, 32, 32);

    if (count > 0) {
      const radius: number = 5;
      const x: number = 25;
      const y: number = 7;

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

export function useAppTitle(): void {
  const isAuth: boolean = useAuthStore(
    (s: { isAuth: boolean }): boolean => s.isAuth,
  );

  const { data } = useQuery<GetChatsData>(GET_MY_CHATS, {
    fetchPolicy: "cache-only",
    skip: !isAuth,
  });

  const lastCountRef = useRef<number>(0);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalUnread: number = useMemo((): number => {
    if (!data?.myChats?.chats) return 0;
    return data.myChats.chats.reduce(
      (acc: number, chat: Chat): number => acc + (chat.unreadCount || 0),
      0,
    );
  }, [data]);

  useLayoutEffect((): (() => void) => {
    const baseTitle: string = "Aerogram";

    if (!isAuth) {
      document.title = baseTitle;
      updateFaviconWithBadge(0);
      return (): void => {};
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
