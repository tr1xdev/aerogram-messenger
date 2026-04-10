import { Suspense } from "react";
import { Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

export default function RootLayout(): React.ReactNode {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <Suspense fallback={<div>Loading Sidebar...</div>}>
          <AppSidebar />
        </Suspense>

        <SidebarInset className="flex-1 overflow-hidden relative">
          <Suspense fallback={<div>Loading Page...</div>}>
            <main className="h-full w-full">
              <Outlet />
            </main>
          </Suspense>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
