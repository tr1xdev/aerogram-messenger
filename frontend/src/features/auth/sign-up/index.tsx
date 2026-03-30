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
import { SignUpForm } from "./components/sign-up-form";
import { useIsMobile } from "@/hooks/use-mobile";

const legalFooter = (
  <>
    By creating an account, you agree to our{" "}
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

export function SignUp() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <AuthMobileShell
        title="Create an account"
        description={
          <>
            Already have one?{" "}
            <Link
              to="/sign-in"
              className="font-semibold text-primary hover:opacity-80 transition-opacity"
            >
              Sign in
            </Link>
          </>
        }
        footer={legalFooter}
      >
        <SignUpForm />
      </AuthMobileShell>
    );
  }

  return (
    <AuthLayout>
      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">
            Create an account
          </CardTitle>
          <CardDescription>
            Already have an account?{" "}
            <Link
              to="/sign-in"
              className="underline underline-offset-4 hover:text-primary font-medium"
            >
              Sign in
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
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
