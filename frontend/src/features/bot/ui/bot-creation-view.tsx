import * as React from "react";
import { useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@apollo/client/react";
import {
  Bot,
  ChevronLeft,
  Sparkles,
  Info,
  Copy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { CREATE_BOT } from "../api/bot.mutations";

interface CreateBotResponse {
  createBot: {
    __typename:
      | "CreateBotPayload"
      | "ValidationError"
      | "ForbiddenError"
      | "InternalError";
    botToken?: string;
    message?: string;
    field?: string;
    user?: {
      id: string;
      username: string;
    };
  };
}

const botSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username cannot exceed 32 characters")
    .endsWith("bot", "Username must end with 'bot'")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  firstName: z.string().min(1, "First name is required").max(64),
  lastName: z.string().max(64).optional(),
  description: z.string().max(256, "Description too long").optional(),
});

type BotFormValues = z.infer<typeof botSchema>;

export const BotCreationView: React.FC = () => {
  const navigate = useNavigate();
  const [tokenToShow, setTokenToShow] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<boolean>(false);

  const [createBot, { loading }] = useMutation<CreateBotResponse>(CREATE_BOT);

  const form = useForm<BotFormValues>({
    resolver: zodResolver(botSchema),
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      description: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (values: BotFormValues): Promise<void> => {
    try {
      const { data } = await createBot({
        variables: {
          username: values.username,
          firstName: values.firstName,
          lastName: values.lastName || "",
          description: values.description || "",
        },
      });

      const result = data?.createBot;
      if (!result) return;

      if (result.__typename === "CreateBotPayload" && result.botToken) {
        setTokenToShow(result.botToken);
        toast.success("Bot instance deployed successfully");
      } else if (result.__typename === "ValidationError" && result.field) {
        form.setError(result.field as Path<BotFormValues>, {
          message: result.message || "Validation failed",
        });
        toast.error(`Validation Error: ${result.message}`);
      } else if (result.message) {
        toast.error(result.message);
      }
    } catch {
      toast.error("Network error: Failed to reach the registry");
    }
  };

  const copyToken = (): void => {
    if (tokenToShow) {
      navigator.clipboard.writeText(tokenToShow);
      setCopied(true);
      setTimeout((): void => setCopied(false), 2000);
      toast.info("Token copied to clipboard");
    }
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-background selection:bg-primary/20">
      <div className="container mx-auto max-w-5xl px-6 py-8 pb-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={(): void => {
            navigate({ to: "/bots" });
          }}
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Registry
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
          <section className="space-y-8">
            <div>
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tighter italic">
                New Instance
              </h1>
              <p className="text-base text-muted-foreground mt-2 leading-relaxed max-w-md">
                Initialize a new autonomous bot in the global registry.
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                          Display Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nexus"
                            disabled={loading}
                            className="bg-muted/30 border-none h-12 text-base rounded-xl focus-visible:ring-1 focus-visible:ring-primary/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex justify-between">
                          Surname{" "}
                          <span className="opacity-40 font-normal">
                            Optional
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Core"
                            disabled={loading}
                            className="bg-muted/30 border-none h-12 text-base rounded-xl focus-visible:ring-1 focus-visible:ring-primary/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                        Operational Handle
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-mono text-base font-bold">
                            @
                          </span>
                          <Input
                            placeholder="nexus_protocol"
                            disabled={loading}
                            className="pl-10 bg-muted/30 border-none h-12 text-base rounded-xl focus-visible:ring-1 focus-visible:ring-primary/50 font-mono"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[10px] mt-1.5 flex items-center gap-1.5 opacity-60">
                        <Info className="h-3 w-3" />
                        A-Z, 0-9, and underscores only.
                      </FormDescription>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                          Instance Abstract
                        </FormLabel>
                        <span className="text-[9px] font-mono opacity-40">
                          {field.value?.length || 0}/256
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the primary function..."
                          disabled={loading}
                          className="bg-muted/30 border-none min-h-[100px] text-base rounded-xl resize-none focus-visible:ring-1 focus-visible:ring-primary/50 p-4"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <div className="flex pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading || !form.formState.isValid}
                    className="w-full sm:w-auto px-12 h-12 rounded-xl text-base font-bold shadow-xl shadow-primary/10 transition-all hover:scale-[1.01]"
                  >
                    {loading ? "Deploying..." : "Deploy Instance"}
                  </Button>
                </div>
              </form>
            </Form>
          </section>

          <aside className="hidden lg:block sticky top-8">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-4 text-center">
              Identity Preview
            </div>
            <Card className="border border-muted/20 bg-muted/5 shadow-none rounded-[24px] overflow-hidden backdrop-blur-sm">
              <CardContent className="pt-8 pb-8 px-6 flex flex-col items-center text-center">
                <div className="h-24 w-24 rounded-[32px] bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6 rotate-2 shadow-xl shadow-primary/20">
                  <Bot className="h-12 w-12 text-primary-foreground -rotate-2" />
                </div>

                <h3 className="text-xl font-black tracking-tight line-clamp-1">
                  {form.watch("firstName") || "Unnamed"}{" "}
                  {form.watch("lastName")}
                </h3>
                <p className="text-primary font-mono text-xs mt-1 font-bold">
                  @{form.watch("username") || "handle"}
                </p>

                <Separator className="my-6 bg-foreground/5" />

                <div className="min-h-[40px] w-full">
                  <p className="text-[12px] leading-relaxed text-muted-foreground/70 italic font-medium line-clamp-2">
                    {form.watch("description")
                      ? `"${form.watch("description")}"`
                      : "Awaiting operational abstract..."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <Dialog
        open={!!tokenToShow}
        onOpenChange={(): void => {
          if (!tokenToShow) navigate({ to: "/bots" });
        }}
      >
        <DialogContent className="sm:max-w-md rounded-[24px] border-none bg-card p-6">
          <DialogHeader className="items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">
              Success
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Bot instance is active. Save this token immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 p-4 bg-muted/40 rounded-xl border border-muted/20 relative group">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/60">
                Access Token
              </span>
              <code className="text-xs font-mono break-all font-bold text-foreground pr-8">
                {tokenToShow}
              </code>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={copyToken}
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="mt-4 flex items-start gap-2 p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-tight text-amber-500/80 font-medium">
              Loss of this token results in permanent loss of access.
            </p>
          </div>

          <DialogFooter className="mt-6">
            <Button
              className="w-full h-12 rounded-xl text-base font-bold"
              onClick={(): void => {
                navigate({ to: "/bots" });
              }}
            >
              Finish Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
