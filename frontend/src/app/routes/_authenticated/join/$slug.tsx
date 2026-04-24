import { createFileRoute } from "@tanstack/react-router";
import { JoinView } from "@/features/join/components/join-view";
import { Suspense } from "react";

export const Route = createFileRoute("/_authenticated/join/$slug")({
  component: JoinRouteComponent,
});

function JoinRouteComponent() {
  const { slug } = Route.useParams();

  return (
    <Suspense
      fallback={<div className="p-8 text-center">Loading preview...</div>}
    >
      <JoinView slug={slug} />
    </Suspense>
  );
}
