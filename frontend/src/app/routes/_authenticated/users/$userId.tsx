import { createFileRoute } from "@tanstack/react-router";
import { UserProfileOverlay } from "@/features/user/ui/user-profile-overlay";
import type { ReactNode } from "react";

export const Route = createFileRoute("/_authenticated/users/$userId")({
  component: UserRouteComponent,
});

function UserRouteComponent(): ReactNode {
  const { userId } = Route.useParams();

  return <UserProfileOverlay userId={userId} />;
}
