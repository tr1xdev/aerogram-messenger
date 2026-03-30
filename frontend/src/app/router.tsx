import { createRouter } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { routeTree } from "@/routeTree.gen";
import { Loader2 } from "lucide-react";

export const router = createRouter({
  routeTree,
  context: {
    queryClient: undefined! as QueryClient,
  },
  defaultPreload: "intent",
  defaultStaleTime: 5000,
  defaultPendingComponent: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
    </div>
  ),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }

  interface StaticDataRouteOption {
    hideSidebar?: boolean;
    hideMobileNav?: boolean;
  }
}
