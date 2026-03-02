import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(protected)/_layout/")({
  component: IndexComponent,
});

function IndexComponent() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-muted/10 text-muted-foreground">
      <div className="rounded-full bg-muted p-4 mb-4">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p className="text-sm font-medium">Select a chat to start messaging</p>
    </div>
  );
}
