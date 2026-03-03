import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { SubscriptionManager } from "@/features/chat/ui/subscription-manager";
import { useMe } from "@/features/chat/lib/use-messages";
import { useE2EEInit } from "@/features/auth/lib/use-e2ee-init";

export default function RootLayout() {
  const navigate = useNavigate();
  const isAuth = useAuthStore((s: { isAuth: boolean }) => s.isAuth);
  const pathname = useRouterState().location.pathname;

  const { data: meData } = useMe();
  useE2EEInit(meData?.me);

  if (!isAuth && !["/login", "/signup", "/otp"].includes(pathname)) {
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
    <>
      {isAuth && <SubscriptionManager />}
      <Outlet />
    </>
  );
}
