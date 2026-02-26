import { createFileRoute } from "@tanstack/react-router";

function IndexPage() {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      Select a chat to start messaging
    </div>
  );
}

export const Route = createFileRoute("/(protected)/")({
  component: IndexPage,
});
