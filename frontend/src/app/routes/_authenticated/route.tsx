import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth-store";
import { AuthenticatedLayout } from "@/features/navigation/layout/app-shell-layout";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuth) {
      throw redirect({ to: "/sign-in" });
    }
  },
  component: AuthenticatedLayout,
});
