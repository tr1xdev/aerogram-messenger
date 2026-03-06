import {
  createFileRoute,
  redirect,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
} from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/layout/app-sidebar";
import { MobileNav } from "@/features/navigation/ui/mobile-nav";
import { cn } from "@/lib/utils";
import { useMe } from "@/features/chat/lib/use-messages";
import { useE2EEInit } from "@/features/auth/lib/use-e2ee-init";
import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence } from "framer-motion";
import { UserProfileOverlay } from "./_layout/user.$userId";
import { useRef, useEffect, useState } from "react";

export const Route = createFileRoute("/(protected)/_layout")({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuth) {
      throw redirect({ to: "/login" });
    }
  },
  component: LayoutComponent,
});

function LayoutComponent() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const lastChatPath = useRef<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = (): void => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (pathname.includes("/chat/")) {
      lastChatPath.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    if (!isMobile && pathname.includes("/user/")) {
      navigate({ to: lastChatPath.current || "/", replace: true });
    }
  }, [isMobile, pathname, navigate]);

  const userMatch = useMatch({
    from: "/(protected)/_layout/user/$userId",
    shouldThrow: false,
  });

  const isProfileOpen = !!userMatch && isMobile;
  const isChatOpen = pathname.includes("/chat/");
  const isSettingsPage = pathname === "/settings";
  const isDetailView = isChatOpen || isProfileOpen || isSettingsPage;

  const { data: meData } = useMe();
  useE2EEInit(meData?.me);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        <div className="flex flex-1 overflow-hidden relative">
          <aside
            className={cn(
              "flex-shrink-0 border-r bg-background z-20 transition-[width] duration-200 ease-in-out w-full md:w-80 lg:w-96",
              isDetailView ? "hidden md:flex" : "flex",
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

          <AnimatePresence>
            {isProfileOpen && userMatch?.params?.userId && (
              <UserProfileOverlay
                key={userMatch.params.userId}
                userId={userMatch.params.userId}
              />
            )}
          </AnimatePresence>
        </div>

        {!isDetailView && <MobileNav />}
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
