import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useVerifyEmail, parseApiError } from "@/features/auth/lib/use-auth";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const formSchema = z.object({
  otp: z
    .string()
    .min(6, "Please enter the 6-digit code.")
    .max(6, "Please enter the 6-digit code."),
});

type FormValues = z.infer<typeof formSchema>;

interface OtpFormProps extends React.HTMLAttributes<HTMLFormElement> {
  userId: string;
}

export function OtpForm({ className, userId, ...props }: OtpFormProps) {
  const { mutate, isPending, error } = useVerifyEmail();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: { otp: "" },
  });

  function onSubmit(data: FormValues) {
    mutate({ input: { userID: userId, code: data.otp } });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-6", className)}
        {...props}
      >
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {parseApiError(error)}
          </div>
        )}

        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center">
              <FormLabel className="sr-only">One-Time Password</FormLabel>
              <FormControl>
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  disabled={isPending}
                  {...field}
                  onComplete={() => form.handleSubmit(onSubmit)()}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          className="w-full"
          disabled={!form.formState.isValid || isPending}
        >
          {isPending ? <Loader2 className="animate-spin" /> : null}
          {isPending ? "Verifying..." : "Verify"}
        </Button>
      </form>
    </Form>
  );
}
