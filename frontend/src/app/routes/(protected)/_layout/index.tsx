import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(protected)/_layout/")({
  component: IndexComponent,
});

function IndexComponent() {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      Select a chat to start messaging
    </div>
  );
}
