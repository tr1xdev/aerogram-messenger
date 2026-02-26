import { createFileRoute, redirect } from "@tanstack/react-router";
import RootLayout from "@/app/layout/root-layout";
import { useAuthStore } from "@/store/auth";

export const Route = createFileRoute("/(protected)/_layout")({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuth) throw redirect({ to: "/login" });
  },
  component: RootLayout,
});
