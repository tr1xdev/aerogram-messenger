import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, parseApiError } from "@/features/auth/lib/use-auth";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type LoginInputs = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

export function LoginPage() {
  const navigate = useNavigate();
  const { mutate, isPending, error } = useLogin();

  const form = useForm<LoginInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginInputs) => {
    mutate({ input: data });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 md:p-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email and password to sign in
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-6 rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive">
              {parseApiError(error)}
            </div>
          )}

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FieldGroup>
              <Field className="w-full">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  {...form.register("email")}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  disabled={isPending}
                />
                {form.formState.errors.email && (
                  <FieldDescription className="text-destructive">
                    {form.formState.errors.email.message}
                  </FieldDescription>
                )}
              </Field>

              <Field className="w-full">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  {...form.register("password")}
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  disabled={isPending}
                />
                {form.formState.errors.password && (
                  <FieldDescription className="text-destructive">
                    {form.formState.errors.password.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Logging in..." : "Login"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  disabled={isPending}
                >
                  Login with Google
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <a
                    onClick={() => navigate({ to: "/signup" })}
                    className="cursor-pointer text-primary underline"
                  >
                    Sign up
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
