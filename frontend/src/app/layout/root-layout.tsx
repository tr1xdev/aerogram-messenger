import { Outlet } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth-store";
import { SubscriptionManager } from "@/features/chat/ui/subscription-manager";
import { useMe } from "@/features/chat/lib";
import { useE2EEInit } from "@/features/auth/lib/use-e2ee-init";
import { useAppTitle } from "@/features/chat/lib/use-app-title";

export default function RootLayout() {
  const isAuth: boolean = useAuthStore(
    (s: { isAuth: boolean }): boolean => s.isAuth,
  );

  const { data: meData } = useMe();
  useE2EEInit(meData?.me);

  useAppTitle();

  return (
    <>
      {isAuth && <SubscriptionManager />}
      <Outlet />
    </>
  );
}
