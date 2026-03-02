import {
  createFileRoute,
  redirect,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/layout/app-sidebar";
import { MobileNav } from "@/features/navigation/ui/mobile-nav";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/(protected)/_layout")({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuth) {
      throw redirect({ to: "/login" });
    }
  },
  component: LayoutComponent,
});

function LayoutComponent() {
  const pathname = useRouterState().location.pathname;
  const isChatOpen = pathname.startsWith("/chat/");

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        <div className="flex flex-1 overflow-hidden">
          <aside
            className={cn(
              "flex-shrink-0 border-r transition-none",
              isChatOpen ? "hidden md:flex md:w-80" : "flex w-full md:w-80",
            )}
          >
            <AppSidebar />
          </aside>

          <main
            className={cn(
              "flex-1 min-w-0 h-full",
              !isChatOpen ? "hidden md:block" : "block",
            )}
          >
            <Outlet />
          </main>
        </div>

        <MobileNav />
      </div>
    </SidebarProvider>
  );
}
