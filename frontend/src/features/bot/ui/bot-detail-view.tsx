import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Bot,
  ChevronLeft,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
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
import { useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BotDeleteDialog } from "./bot-delete-dialog";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  UPDATE_BOT,
  DELETE_BOT,
  ROTATE_BOT_TOKEN,
  GET_MY_BOTS,
} from "@/features/bot/api";

// Обновленная схема с проверками как на бэкенде
const botSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username is too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores allowed")
    .refine((val: string): boolean => val.toLowerCase().endsWith("bot"), {
      message: "Username must end with 'bot' (e.g. MyBot)",
    }),
  firstName: z
    .string()
    .min(1, "Display name is required")
    .max(64, "Display name is too long")
    .transform((val: string): string => val.trim()),
  description: z
    .string()
    .max(256, "Description is too long")
    .optional()
    .or(z.literal("")),
});

type BotFormValues = z.infer<typeof botSchema>;

interface Bot {
  id: string;
  username: string;
  firstName: string;
  botDescription?: string;
}

interface GetMyBotsData {
  myBots: Bot[];
}

interface RotateBotTokenData {
  rotateBotToken: string;
}

export const BotDetailView: React.FC = () => {
  const { botId } = useParams({ from: "/_authenticated/bots/$botId" });
  const navigate = useNavigate();

  const [showToken, setShowToken] = React.useState<boolean>(false);
  const [currentToken, setCurrentToken] = React.useState<string>("");
  const [wasTokenExposed, setWasTokenExposed] = React.useState<boolean>(false);

  const { data, loading } = useQuery<GetMyBotsData>(GET_MY_BOTS);
  const botData: Bot | undefined = data?.myBots?.find(
    (b: Bot): boolean => b.id === botId,
  );

  const [updateBot] = useMutation(UPDATE_BOT);
  const [deleteBot] = useMutation(DELETE_BOT, {
    refetchQueries: [{ query: GET_MY_BOTS }],
  });
  const [rotateToken, { loading: isRotating }] =
    useMutation<RotateBotTokenData>(ROTATE_BOT_TOKEN);

  const form = useForm<BotFormValues>({
    resolver: zodResolver(botSchema),
    mode: "onChange", // Валидация при каждом изменении для живого фидбека
    defaultValues: {
      username: "",
      firstName: "",
      description: "",
    },
  });

  React.useEffect((): void => {
    if (botData) {
      form.reset({
        username: botData.username || "",
        firstName: botData.firstName || "",
        description: botData.botDescription || "",
      });
    }
  }, [botData, form]);

  const { isDirty, isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: BotFormValues): Promise<void> => {
    try {
      await updateBot({
        variables: {
          id: botId,
          input: {
            username: values.username,
            firstName: values.firstName,
            botDescription: values.description,
          },
        },
      });
      form.reset(values);
      toast.success("Settings updated successfully");
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.message?.includes("unique") || err.message?.includes("taken"))
      ) {
        form.setError("username", {
          message: "This username is already taken",
        });
      } else {
        toast.error("Failed to save changes");
      }
    }
  };

  const handleRefreshToken = async (): Promise<void> => {
    try {
      const { data: rotateData } = await rotateToken({
        variables: { id: botId },
      });
      if (rotateData?.rotateBotToken) {
        setCurrentToken(rotateData.rotateBotToken);
        setShowToken(true);
        setWasTokenExposed(false);
        toast.success("API Token rotated successfully");
      }
    } catch {
      toast.error("Could not rotate token");
    }
  };

  const toggleTokenVisibility = (): void => {
    if (!showToken) {
      const confirmView = window.confirm(
        "This token can only be viewed once. Are you sure?",
      );
      if (confirmView) {
        setShowToken(true);
        setWasTokenExposed(true);
      }
    } else {
      setShowToken(false);
      setCurrentToken("");
    }
  };

  const handleDeleteBot = async (): Promise<void> => {
    try {
      await deleteBot({ variables: { id: botId } });
      toast.success("Bot permanently deleted");
      navigate({ to: "/bots" });
    } catch {
      toast.error("Failed to delete bot");
    }
  };

  if (loading) return null;

  return (
    <div className="h-screen w-full overflow-y-auto bg-background selection:bg-primary/10">
      <div className="container mx-auto max-w-2xl px-6 py-8 pb-32">
        <Button
          variant="ghost"
          onClick={(): void => {
            navigate({ to: "/bots" });
          }}
          className="mb-8 -ml-2 text-muted-foreground hover:text-foreground h-8 px-2 text-[13px] hover:bg-transparent cursor-pointer"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to list
        </Button>

        <header className="flex items-center gap-4 mb-12">
          <div className="h-12 w-12 rounded-2xl bg-muted/20 flex items-center justify-center border border-muted/10">
            <Bot className="h-6 w-6 text-primary/70" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight leading-none">
              {form.watch("firstName") || "Untitled Bot"}
            </h1>
            <p className="text-[12px] font-mono text-muted-foreground/50 mt-1.5">
              @{form.watch("username")}
            </p>
          </div>
        </header>

        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40">
              Authentication
            </h2>
            <div className="flex flex-col gap-3">
              <div className="relative group">
                <Input
                  readOnly
                  type={showToken ? "text" : "password"}
                  value={
                    showToken ? currentToken : "••••••••••••••••••••••••••••••"
                  }
                  className="bg-muted/10 border-muted/20 font-mono text-[12px] h-11 rounded-xl pr-24 focus:ring-0 cursor-default"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground/40 disabled:cursor-not-allowed cursor-pointer"
                    disabled={(wasTokenExposed && !showToken) || !currentToken}
                    onClick={toggleTokenVisibility}
                  >
                    {showToken ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!showToken || !currentToken}
                    className="h-8 w-8 text-muted-foreground/40 disabled:cursor-not-allowed cursor-pointer"
                    onClick={(): void => {
                      if (currentToken) {
                        navigator.clipboard.writeText(currentToken);
                        toast.success("Token copied");
                      }
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                disabled={isRotating}
                onClick={handleRefreshToken}
                className="w-fit h-9 text-[12px] font-bold rounded-lg border-muted/20 hover:bg-muted/10 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw
                  className={cn(
                    "mr-2 h-3.5 w-3.5 text-primary/60",
                    isRotating && "animate-spin",
                  )}
                />
                Rotate API Token
              </Button>

              {wasTokenExposed && !showToken && (
                <p className="text-[10px] text-destructive/70 px-1 flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" />
                  Token hidden for security. Rotate to generate a new one.
                </p>
              )}
            </div>
          </section>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40">
                  Identity & Details
                </h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[12px] font-bold text-muted-foreground/70">
                          Display Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="My Awesome Bot"
                            className="bg-muted/10 border-muted/20 h-10 rounded-lg text-[13px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[11px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[12px] font-bold text-muted-foreground/70">
                          Username
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="example_bot"
                            className={cn(
                              "bg-muted/10 border-muted/20 h-10 rounded-lg font-mono text-[13px]",
                              form.formState.errors.username &&
                                "border-destructive/50 focus-visible:ring-destructive/20",
                            )}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[12px] font-bold text-muted-foreground/70">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className="bg-muted/10 border-muted/20 min-h-[100px] rounded-lg text-[13px] resize-none"
                          {...field}
                          placeholder="What does this bot do?"
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] text-muted-foreground/40">
                        Describe the bot's purpose in a few sentences.
                      </FormDescription>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-8 flex items-center justify-between border-t border-muted/10">
                <Button
                  type="submit"
                  disabled={!isDirty || isSubmitting || !isValid}
                  className={cn(
                    "h-10 px-6 rounded-xl font-bold text-[13px] transition-all duration-200 shadow-lg shadow-primary/10 disabled:cursor-not-allowed cursor-pointer",
                    (!isDirty || !isValid) && "opacity-40 grayscale-[0.5]",
                  )}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>

                <BotDeleteDialog
                  username={form.getValues("username")}
                  firstName={form.getValues("firstName")}
                  onConfirm={handleDeleteBot}
                />
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};
