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

  const { data: meData } = useMe();

  useE2EEInit(meData?.me);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        <div className="flex flex-1 overflow-hidden relative">
          <aside
            className={cn(
              "flex-shrink-0 border-r bg-background z-20",
              "transition-[width] duration-200 ease-in-out",
              "w-full md:w-80 lg:w-96",
              isChatOpen ? "hidden md:flex" : "flex",
            )}
          >
            <AppSidebar />
          </aside>

          <main
            className={cn(
              "flex-1 min-w-0 h-full bg-background relative",
              !isChatOpen ? "hidden md:block" : "block",
            )}
          >
            <Outlet />
          </main>
        </div>

        {!isChatOpen && <MobileNav />}
      </div>
    </SidebarProvider>
  );
}
