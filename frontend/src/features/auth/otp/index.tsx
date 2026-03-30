import { useSearch } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthLayout } from "../auth-layout";
import { OtpForm } from "./components/otp-form";
import { OtpMobile } from "./components/otp-mobile";
import { useIsMobile } from "@/hooks/use-mobile";

export function Otp() {
  const isMobile = useIsMobile();
  const { userId } = useSearch({ from: "/(auth)/otp" });

  if (isMobile) {
    return <OtpMobile userId={userId} />;
  }

  return (
    <AuthLayout>
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-base tracking-tight">
            Two-factor Authentication
          </CardTitle>
          <CardDescription>
            Please enter the authentication code. <br /> We have sent the
            authentication code to your email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OtpForm userId={userId} />
        </CardContent>
        <CardFooter>
          <p className="px-4 text-center text-sm text-muted-foreground">
            Haven&apos;t received it?{" "}
            <Link
              to="/sign-in"
              className="underline underline-offset-4 hover:text-primary"
            >
              Resend a new code.
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
