import { createFileRoute } from "@tanstack/react-router";
import { JoinView } from "@/features/join/components/join-view";
import { JoinSkeleton } from "@/features/join/components/join-skeleton";
import { Suspense, type ReactNode } from "react";

export const Route = createFileRoute("/_authenticated/join/$slug")({
  component: JoinRouteComponent,
});

function JoinRouteComponent(): ReactNode {
  const { slug } = Route.useParams();

  return (
    <Suspense fallback={<JoinSkeleton />}>
      <JoinView slug={slug} />
    </Suspense>
  );
}
