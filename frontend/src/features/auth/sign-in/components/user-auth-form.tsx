import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { Loader2, LogIn } from "lucide-react";
import { IconFacebook, IconGithub } from "@/assets/brand-icons";
import { useLogin, parseApiError } from "@/features/auth/lib/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(1, "Please enter your password")
    .min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof formSchema>;

type UserAuthFormProps = React.HTMLAttributes<HTMLFormElement>;

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const { mutate, isPending, error } = useLogin();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(data: FormValues) {
    mutate({ input: data });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-3", className)}
        {...props}
      >
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {parseApiError(error)}
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="name@example.com"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="relative">
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="••••••••"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <Link
                to="/forgot-password"
                className="absolute inset-e-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75"
              >
                Forgot password?
              </Link>
            </FormItem>
          )}
        />

        <Button className="mt-2" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <LogIn />}
          Sign in
        </Button>

        <div className="my-2 flex items-center gap-3">
          <div className="flex-1 border-t" />
          <span className="text-xs uppercase text-muted-foreground">
            Or continue with
          </span>
          <div className="flex-1 border-t" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" type="button" disabled={isPending}>
            <IconGithub className="h-4 w-4" /> GitHub
          </Button>
          <Button variant="outline" type="button" disabled={isPending}>
            <IconFacebook className="h-4 w-4" /> Facebook
          </Button>
        </div>
      </form>
    </Form>
  );
}
