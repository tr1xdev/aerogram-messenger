import * as React from "react";
import {
  Outlet,
  useLocation,
  useMatch,
  useMatches,
  useNavigate,
} from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";

import { useChatStore } from "@/store/chat";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/layout/app-sidebar";
import { MobileNav } from "@/features/navigation/ui/mobile-nav";
import { UserProfileOverlay } from "@/features/user/ui/user-profile-overlay";
import { Toaster } from "@/components/ui/sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { SubscriptionManager } from "@/features/chat/ui/subscription-manager";

export function AuthenticatedLayout(): React.ReactNode {
  const matches = useMatches();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isMobile: boolean = useIsMobile();

  const lastChatPath = React.useRef<string | null>(null);
  const setActiveChatId = useChatStore(
    (state: { setActiveChatId: (id: string | null) => void }) =>
      state.setActiveChatId,
  );

  const userMatch = useMatch({
    from: "/_authenticated/users/$userId",
    shouldThrow: false,
  });

  React.useEffect((): void => {
    if (pathname.includes("/chat/")) {
      const id: string | undefined = pathname.split("/").pop();
      lastChatPath.current = pathname;
      setActiveChatId(id || null);
    } else {
      setActiveChatId(null);
    }
  }, [pathname, setActiveChatId]);

  React.useEffect((): void => {
    if (!isMobile && pathname.includes("/users/")) {
      navigate({ to: lastChatPath.current || "/", replace: true });
    }
  }, [isMobile, pathname, navigate]);

  const hideSidebarRequested: boolean = matches.some(
    (m: { staticData?: { hideSidebar?: boolean } }) =>
      m.staticData?.hideSidebar,
  );
  const hideMobileNavRequested: boolean = matches.some(
    (m: { staticData?: { hideMobileNav?: boolean } }) =>
      m.staticData?.hideMobileNav,
  );

  const isProfileOpen: boolean = !!userMatch && isMobile;
  const isChatOpen: boolean = pathname.includes("/chat/");
  const isSettingsPage: boolean = pathname === "/settings";

  const isDetailView: boolean =
    isChatOpen || isProfileOpen || isSettingsPage || hideSidebarRequested;
  const shouldHideNav: boolean =
    isChatOpen || isProfileOpen || hideMobileNavRequested;

  return (
    <SidebarProvider defaultOpen={true}>
      <SubscriptionManager />
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
        <div className="flex flex-1 overflow-hidden relative min-h-0">
          {!hideSidebarRequested && (
            <div
              className={cn(
                "flex-shrink-0 transition-all duration-200 border-r border-border/50",
                isDetailView ? "hidden md:block" : "block w-full md:w-auto",
              )}
            >
              <AppSidebar />
            </div>
          )}

          <main
            className={cn(
              "flex-1 min-w-0 h-full bg-background relative z-10",
              isMobile && !isDetailView ? "hidden" : "block",
            )}
          >
            <div
              className={cn(
                "h-full w-full transition-all duration-300 relative overflow-hidden",
                isProfileOpen && "pointer-events-none scale-[0.98] opacity-50",
              )}
            >
              <Outlet />
            </div>
          </main>

          <AnimatePresence mode="wait">
            {isProfileOpen && userMatch?.params?.userId && (
              <UserProfileOverlay
                key={userMatch.params.userId}
                userId={userMatch.params.userId}
              />
            )}
          </AnimatePresence>
        </div>

        {!shouldHideNav && isMobile && (
          <div className="flex-shrink-0 border-t border-border/50">
            <MobileNav />
          </div>
        )}
      </div>

      <Toaster
        position="bottom-center"
        toastOptions={{
          className:
            "bg-zinc-900 text-white border-zinc-800 text-[13px] h-10 px-4 rounded-xl shadow-2xl",
        }}
      />
    </SidebarProvider>
  );
}
