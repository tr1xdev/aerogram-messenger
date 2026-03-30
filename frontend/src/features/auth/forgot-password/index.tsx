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
import { AuthMobileShell } from "../components/auth-mobile-shell";
import { ForgotPasswordForm } from "./components/forgot-password-form";
import { useIsMobile } from "@/hooks/use-mobile";

const footer = (
  <>
    Don&apos;t have an account?{" "}
    <Link
      to="/sign-up"
      className="underline hover:text-foreground transition-colors"
    >
      Sign up
    </Link>
    .
  </>
);

export function ForgotPassword() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <AuthMobileShell
        title="Forgot password?"
        description="Enter your registered email and we will send you a link to reset your password."
        footer={footer}
      >
        <ForgotPasswordForm />
      </AuthMobileShell>
    );
  }

  return (
    <AuthLayout>
      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">
            Forgot Password
          </CardTitle>
          <CardDescription>
            Enter your registered email and <br className="hidden sm:block" />{" "}
            we will send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter>
          <p className="mx-auto px-8 text-center text-sm text-balance text-muted-foreground">
            {footer}
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
