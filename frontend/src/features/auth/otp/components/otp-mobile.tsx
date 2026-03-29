import { Link } from "@tanstack/react-router";
import { OtpForm } from "./otp-form";

interface OtpMobileProps {
  userId: string;
}

export function OtpMobile({ userId }: OtpMobileProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center space-y-6 px-4">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Two-factor Authentication
        </h1>
        <p className="text-sm text-muted-foreground">
          Please enter the authentication code. <br /> We have sent the
          authentication code to your email.
        </p>
      </div>

      <OtpForm className="w-full" userId={userId} />

      <p className="text-center text-sm text-muted-foreground">
        Haven&apos;t received it?{" "}
        <Link
          to="/sign-in"
          className="underline underline-offset-4 hover:text-primary"
        >
          Resend a new code.
        </Link>
      </p>
    </div>
  );
}
