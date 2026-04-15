import { Suspense } from "react";
import { Outlet } from "@tanstack/react-router";

export default function RootLayout(): React.ReactNode {
  return (
    <div className="h-full w-full overflow-hidden bg-background">
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </div>
  );
}
