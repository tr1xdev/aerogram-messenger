import { useLayoutEffect, useRef } from "react";
import { useApolloClient } from "@apollo/client/react";
import { useAuthStore } from "@/store/auth";
import { GET_MY_CHATS } from "../api";
import type { Chat } from "@/entities/chat/model/types";

interface GetChatsData {
  myChats: {
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
  img.src = `${FAVICON_SOURCE}?v=${Date.now()}`;
  img.crossOrigin = "anonymous";

  img.onload = (): void => {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, 32, 32);

    if (count > 0) {
      const radius: number = 4.5;
      const x: number = 26;
      const y: number = 26;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "source-over";
      ctx.beginPath();
      ctx.arc(x, y, radius + 1, 0, Math.PI * 2);
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
  const client = useApolloClient();
  const lastCountRef = useRef<number>(0);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTitleRef = useRef<string>("Aerogram");

  useLayoutEffect((): (() => void) => {
    const baseTitle: string = "Aerogram";

    if (!isAuth) {
      document.title = baseTitle;
      updateFaviconWithBadge(0);
      return (): void => {};
    }

    const handleUpdate = (): void => {
      try {
        const cacheData = client.readQuery<GetChatsData>({
          query: GET_MY_CHATS,
        });
        const chats: Chat[] = cacheData?.myChats?.chats || [];
        const totalUnread: number = chats.reduce(
          (acc: number, chat: Chat): number => acc + (chat.unreadCount || 0),
          0,
        );

        const displayCount: string =
          totalUnread > 99 ? "99+" : totalUnread.toString();
        const formattedTitle: string =
          totalUnread > 0 ? `(${displayCount}) ${baseTitle}` : baseTitle;
        currentTitleRef.current = formattedTitle;

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
      } catch {
        document.title = baseTitle;
      }
    };

    const onFocus = (): void => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      document.title = currentTitleRef.current;
    };

    window.addEventListener("focus", onFocus);

    const observer = client.watchQuery<GetChatsData>({
      query: GET_MY_CHATS,
      fetchPolicy: "cache-only",
    });

    const sub = observer.subscribe({
      next: (): void => {
        requestAnimationFrame(handleUpdate);
      },
    });

    handleUpdate();

    return (): void => {
      sub.unsubscribe();
      window.removeEventListener("focus", onFocus);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      document.title = baseTitle;
    };
  }, [isAuth, client]);
}
