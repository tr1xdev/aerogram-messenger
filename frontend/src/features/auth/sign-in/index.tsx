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
import { UserAuthForm } from "./components/user-auth-form";
import { useIsMobile } from "@/hooks/use-mobile";

const legalFooter = (
  <>
    By signing in, you agree to our{" "}
    <a
      href="/terms"
      className="underline hover:text-foreground transition-colors"
    >
      Terms of Service
    </a>{" "}
    and{" "}
    <a
      href="/privacy"
      className="underline hover:text-foreground transition-colors"
    >
      Privacy Policy
    </a>
    .
  </>
);

export function SignIn() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <AuthMobileShell
        title="Welcome back"
        description={
          <>
            New to Aerogram?{" "}
            <Link to="/sign-up" className="font-semibold text-primary">
              Create an account
            </Link>
          </>
        }
        footer={legalFooter}
      >
        <UserAuthForm />
      </AuthMobileShell>
    );
  }

  return (
    <AuthLayout>
      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password below to log into your account.{" "}
            <Link
              to="/sign-up"
              className="underline underline-offset-4 hover:text-primary"
            >
              Don&apos;t have an account?
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm />
        </CardContent>
        <CardFooter>
          <p className="px-8 text-center text-sm text-muted-foreground">
            {legalFooter}
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
