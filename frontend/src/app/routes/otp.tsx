import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/otp")({
  component: OtpPage,
});

function OtpPage() {
  const params = Route.useSearch() as { userId?: string };
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);

  const updateDigit = (i: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[i] = value;
    setDigits(newDigits);
    if (value && i < 5) {
      const next = document.getElementById(`otp-${i + 1}`);
      next?.focus();
    }
  };

  const handleSubmit = () => {
    if (digits.join("").length !== 6) return;
    setLoading(true);
    setTimeout(() => navigate({ to: "/" }), 600);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm text-center space-y-4">
        <h2 className="text-xl font-semibold">Verify Code</h2>
        <p className="text-sm text-muted-foreground">Enter the 6‑digit code</p>

        <div className="flex justify-between gap-2">
          {digits.map((digit, i) => (
            <Input
              key={i}
              id={`otp-${i}`}
              value={digit}
              onChange={(e) => updateDigit(i, e.target.value)}
              className="w-12 h-12 text-center text-lg"
              maxLength={1}
            />
          ))}
        </div>

        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? "Verifying…" : "Confirm"}
        </Button>

        {params.userId && (
          <p className="text-xs text-muted-foreground break-all">
            {params.userId}
          </p>
        )}
      </div>
    </div>
  );
}
