import {
  createFileRoute,
  redirect,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/layout/app-sidebar";
import { MobileNav } from "@/features/navigation/ui/mobile-nav";
import { cn } from "@/lib/utils";
import { useMe } from "@/features/chat/lib/use-messages";
import { useE2EEInit } from "@/features/auth/lib/use-e2ee-init";
import { Toaster } from "@/components/ui/sonner";

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
  const isChatOpen = pathname.includes("/chat/");
  const isSettingsPage = pathname === "/settings";

  const { data: meData } = useMe();
  useE2EEInit(meData?.me);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <div
          className={cn(
            "flex-shrink-0 h-full border-r bg-background transition-[width] duration-200",
            "md:w-80 lg:w-96",
            isChatOpen || isSettingsPage
              ? "hidden md:block"
              : "w-full md:block",
          )}
        >
          <AppSidebar />
        </div>

        <main
          className={cn(
            "flex-1 min-w-0 h-full bg-background relative",
            !isChatOpen && !isSettingsPage ? "hidden md:block" : "block",
          )}
        >
          <Outlet />
        </main>

        {!isChatOpen && <MobileNav />}
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
