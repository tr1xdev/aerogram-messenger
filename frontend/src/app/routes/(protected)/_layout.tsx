import * as React from "react";
import {
  createFileRoute,
  redirect,
  Outlet,
  useLocation,
  useMatch,
  useMatches,
  useNavigate,
} from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";

import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/layout/app-sidebar";
import { MobileNav } from "@/features/navigation/ui/mobile-nav";
import { UserProfileOverlay } from "@/features/user/ui/user-profile-overlay";
import { Toaster } from "@/components/ui/sonner";

import { useMe } from "@/features/chat/lib/common/use-me";
import { useE2EEInit } from "@/features/auth/lib/use-e2ee-init";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/(protected)/_layout")({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuth) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: LayoutComponent,
});

function LayoutComponent() {
  const matches = useMatches();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isMobile: boolean = useIsMobile();

  const lastChatPath = React.useRef<string | null>(null);
  const setActiveChatId = useChatStore((state) => state.setActiveChatId);

  const userMatch = useMatch({
    from: "/_authenticated/users/$userId",
    shouldThrow: false,
  });

  const { data: meData } = useMe();
  useE2EEInit(meData?.me);

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
    (m) => m.staticData?.hideSidebar,
  );
  const hideMobileNavRequested: boolean = matches.some(
    (m) => m.staticData?.hideMobileNav,
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
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        <div className="flex flex-1 overflow-hidden relative">
          <aside
            className={cn(
              "flex-shrink-0 border-r bg-background z-20 transition-[width] duration-200 ease-in-out w-full md:w-80 lg:w-96",
              isDetailView ? "hidden md:flex" : "flex",
              hideSidebarRequested && "md:hidden",
            )}
          >
            <AppSidebar />
          </aside>

          <main className="flex-1 min-w-0 h-full bg-background relative z-10">
            <div
              className={cn(
                "h-full w-full transition-all duration-300",
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

        {!shouldHideNav && <MobileNav />}
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
