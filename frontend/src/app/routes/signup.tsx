import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
  name: z.string().min(2, { message: "Name is required" }),
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
  const form = useForm<SignupInputs>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = () => {
    const fakeUserId = crypto.randomUUID();
    navigate({ to: "/otp", search: { userId: fakeUserId } });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 md:p-10">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FieldGroup>
              <Field className="w-full">
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  {...form.register("name")}
                  id="name"
                  placeholder="Your full name"
                />
                {form.formState.errors.name && (
                  <FieldDescription className="text-destructive">
                    {form.formState.errors.name.message}
                  </FieldDescription>
                )}
              </Field>

              <Field className="w-full">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  {...form.register("email")}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
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
                />
                {form.formState.errors.password && (
                  <FieldDescription className="text-destructive">
                    {form.formState.errors.password.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <Button type="submit" className="w-full">
                  Sign up
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
