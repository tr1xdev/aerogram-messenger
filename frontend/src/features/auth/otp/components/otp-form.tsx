import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { showSubmittedData } from "@/lib/show-submitted-data";
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

type OtpFormProps = React.HTMLAttributes<HTMLFormElement>;

export function OtpForm({ className, ...props }: OtpFormProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: "" },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const otp = form.watch("otp");

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);
    showSubmittedData(data);

    setTimeout(() => {
      setIsLoading(false);
      navigate({ to: "/" });
    }, 1500);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-6", className)}
        {...props}
      >
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem className="flex flex-col items-center">
              <FormLabel className="sr-only">One-Time Password</FormLabel>
              <FormControl>
                <InputOTP
                  id="digits-only"
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  {...field}
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
        <Button className="w-full" disabled={otp.length < 6 || isLoading}>
          {isLoading ? "Verifying..." : "Verify"}
        </Button>
      </form>
    </Form>
  );
}
