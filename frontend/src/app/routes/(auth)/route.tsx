import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth-store";

export const Route = createFileRoute("/(auth)")({
  beforeLoad: () => {
    if (useAuthStore.getState().isAuth) {
      throw redirect({ to: "/" });
    }
  },
  component: () => <Outlet />,
});
