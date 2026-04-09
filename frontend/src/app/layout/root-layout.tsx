import { Outlet } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth-store";
import { SubscriptionManager } from "@/features/chat/ui/subscription-manager";
import { useAppTitle } from "@/features/chat/lib";

export default function RootLayout() {
  const isAuth: boolean = useAuthStore(
    (s: { isAuth: boolean }): boolean => s.isAuth,
  );

  useAppTitle();

  return (
    <>
      {isAuth && <SubscriptionManager />}
      <Outlet />
    </>
  );
}
