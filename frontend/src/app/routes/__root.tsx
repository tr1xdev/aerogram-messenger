import { createRootRoute } from "@tanstack/react-router";
import RootLayout from "@/app/layout/root-layout";

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <div className="flex h-dvh w-full items-center justify-center bg-background text-foreground">
      <div className="flex items-center space-x-3">
        <h1 className="text-2xl font-bold">404</h1>
        <span className="h-10 w-px bg-accent" />
        <span className="text-sm">This page could not be found</span>
      </div>
    </div>
  ),
});
