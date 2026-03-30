import { Link } from "@tanstack/react-router";
import { AuthMobileShell } from "@/features/auth/components/auth-mobile-shell";
import { OtpForm } from "./otp-form";

interface OtpMobileProps {
  userId: string;
}

export function OtpMobile({ userId }: OtpMobileProps) {
  return (
    <AuthMobileShell
      title="Check your email"
      description="Enter the 6-digit code we sent to your email address."
      footer={
        <>
          Didn&apos;t receive a code?{" "}
          <Link
            to="/sign-in"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Go back to sign in
          </Link>
        </>
      }
    >
      <OtpForm className="w-full" userId={userId} />
    </AuthMobileShell>
  );
}
