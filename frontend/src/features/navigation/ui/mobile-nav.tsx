import { Link, useRouterState } from "@tanstack/react-router";
import { MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyChats } from "@/features/chat/lib/use-messages";
import type { Chat } from "@/entities/chat/model/types";

export function MobileNav() {
  const pathname = useRouterState().location.pathname;
  const isChatOpen = pathname.startsWith("/chat/");
  const { data: chatsData } = useMyChats();

  if (isChatOpen) return null;

  const totalUnread =
    chatsData?.myChats?.reduce(
      (acc: number, chat: Chat) => acc + (chat.unreadCount || 0),
      0,
    ) || 0;

  const navItems = [
    {
      id: "chats",
      label: "Chats",
      icon: MessageSquare,
      to: "/" as const,
      badge: totalUnread > 0 ? totalUnread : null,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      to: "/settings" as const,
      badge: null,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1000] flex flex-col md:hidden isolate bg-background">
      <div className="relative flex h-[64px] w-full items-stretch justify-center bg-background">
        <div className="absolute top-0 left-0 right-0 h-[0.5px] bg-border/50" />

        <div className="flex items-stretch justify-center gap-14 px-6">
          {navItems.map((item) => {
            const isActive = pathname === item.to;

            return (
              <Link
                key={item.id}
                to={item.to}
                className={cn(
                  "relative flex w-16 flex-col items-center justify-center outline-none transition-colors duration-75",
                  isActive ? "text-primary" : "text-muted-foreground/45",
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="relative h-6 w-6 flex items-center justify-center active:scale-90 transition-transform duration-75">
                    <item.icon
                      className={cn(
                        "h-[22px] w-[22px]",
                        isActive ? "stroke-[2.2px]" : "stroke-[1.8px]",
                      )}
                    />

                    {item.badge !== null ? (
                      <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm animate-in fade-in zoom-in duration-200">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : (
                      isActive && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                        </span>
                      )
                    )}
                  </div>

                  <span className="text-[11px] font-semibold tracking-tight">
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="h-[env(safe-area-inset-bottom)] w-full bg-background" />
    </nav>
  );
}
