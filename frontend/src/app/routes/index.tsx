import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function IndexPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 md:p-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome to the Router</CardTitle>
          <CardDescription>Start by logging in or signing up</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <Button onClick={() => navigate({ to: "/login" })} className="w-full">
            Login
          </Button>
          <Button
            onClick={() => navigate({ to: "/signup" })}
            variant="outline"
            className="w-full"
          >
            Sign Up
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: IndexPage,
});
