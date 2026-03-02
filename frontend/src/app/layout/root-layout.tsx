import { Outlet, useNavigate } from "@tanstack/react-router";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { AppSidebar } from "./app-sidebar";
import { SubscriptionManager } from "@/features/chat/ui/subscription-manager";

export default function RootLayout() {
  const navigate = useNavigate();
  const isAuth = useAuthStore((s) => s.isAuth);

  if (!isAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 md:p-10">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Start by logging in or signing up</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button
              onClick={() => navigate({ to: "/login" })}
              className="w-full"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate({ to: "/signup" })}
              variant="outline"
              className="w-full"
            >
              Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <SubscriptionManager />
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <header className="flex h-14 items-center border-b px-4 shrink-0 md:hidden">
          <SidebarTrigger />
        </header>
        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
