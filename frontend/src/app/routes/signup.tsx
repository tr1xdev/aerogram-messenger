import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSignUp, parseApiError } from "@/features/auth/lib/use-auth";
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

const signupSchema = z.object({
  first_name: z.string().min(2, { message: "First name is required" }),
  last_name: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type SignupInputs = z.infer<typeof signupSchema>;

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

export function SignupPage() {
  const navigate = useNavigate();
  const { mutate, isPending, error } = useSignUp();

  const form = useForm<SignupInputs>({
    resolver: zodResolver(signupSchema),
    defaultValues: { first_name: "", last_name: "", email: "", password: "" },
  });

  const onSubmit = (data: SignupInputs) => {
    mutate({ input: { ...data, username: data.email.split("@")[0] } });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 md:p-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-6 rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive text-left">
              {parseApiError(error)}
            </div>
          )}

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="first_name">First Name</FieldLabel>
                  <Input
                    {...form.register("first_name")}
                    id="first_name"
                    disabled={isPending}
                  />
                  {form.formState.errors.first_name && (
                    <FieldDescription className="text-destructive">
                      {form.formState.errors.first_name.message}
                    </FieldDescription>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="last_name">Last Name</FieldLabel>
                  <Input
                    {...form.register("last_name")}
                    id="last_name"
                    disabled={isPending}
                  />
                </Field>
              </div>

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
                  {isPending ? "Creating account..." : "Sign up"}
                </Button>
                <FieldDescription className="text-center mt-2">
                  Already have an account?{" "}
                  <a
                    onClick={() => navigate({ to: "/login" })}
                    className="cursor-pointer text-primary underline"
                  >
                    Log in
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
