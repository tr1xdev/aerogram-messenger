import { Suspense } from "react";
import { Outlet } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth-store";
import { SubscriptionManager } from "@/features/chat/ui/subscription-manager";

export default function RootLayout() {
  const isAuth: boolean = useAuthStore(
    (s: { isAuth: boolean }): boolean => s.isAuth,
  );

  return (
    <>
      {isAuth && (
        <Suspense fallback={null}>
          <SubscriptionManager />
        </Suspense>
      )}
      <Outlet />
    </>
  );
}
