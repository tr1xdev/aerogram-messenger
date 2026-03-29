import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { IconFacebook, IconGithub } from "@/assets/brand-icons";
import { useSignUp, parseApiError } from "@/features/auth/lib/use-auth";
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

const formSchema = z
  .object({
    firstName: z.string().min(2, "Min. 2 characters"),
    lastName: z.string().optional(),
    username: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[a-zA-Z0-9_]{3,32}$/.test(val),
        "Username must be 3–32 characters and only contain letters, numbers, or underscores",
      ),
    email: z.string().email("Please enter a valid email"),
    password: z
      .string()
      .min(1, "Please enter your password")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

export function SignUpForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const { mutate, isPending, error } = useSignUp();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(data: FormValues) {
    mutate({
      input: {
        firstName: data.firstName,
        lastName: data.lastName || undefined,
        username: data.username || undefined,
        email: data.email,
        password: data.password,
      },
    });
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-start">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" disabled={isPending} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Last Name{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </FormLabel>
                <FormControl>
                  <Input placeholder="Doe" disabled={isPending} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Username{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
                    @
                  </span>
                  <Input
                    placeholder="yourhandle"
                    disabled={isPending}
                    className="pl-7"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
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
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="••••••••"
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
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder="••••••••"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="mt-2" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          Create Account
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
