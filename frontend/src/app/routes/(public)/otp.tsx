import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useVerifyEmail, parseApiError } from "@/features/auth/lib/use-auth";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export const Route = createFileRoute("/(public)/otp")({
  validateSearch: (search: Record<string, unknown>) => ({
    userId: (search.userId as string) || "",
  }),
  component: OtpPage,
});

function OtpPage() {
  const { userId } = Route.useSearch();
  const [code, setCode] = useState("");
  const { mutate, isPending, error } = useVerifyEmail();

  const handleSubmit = () => {
    if (code.length !== 6) return;
    mutate({ input: { userID: userId, code } });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Verify Code</h2>
          <p className="text-sm text-muted-foreground">
            Enter the 6‑digit code sent to your email
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive text-left">
            {parseApiError(error)}
          </div>
        )}

        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(value) => setCode(value)}
            disabled={isPending}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={code.length !== 6 || isPending}
        >
          {isPending ? "Verifying…" : "Confirm"}
        </Button>

        <p className="text-xs text-muted-foreground italic">ID: {userId}</p>
      </div>
    </div>
  );
}
