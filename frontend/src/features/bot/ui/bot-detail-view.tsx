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
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BotDeleteDialog } from "./bot-delete-dialog";

const botSchema = z.object({
  username: z.string().min(3).max(32),
  firstName: z.string().min(1).max(64),
  description: z.string().max(256).optional(),
});

type BotFormValues = z.infer<typeof botSchema>;

export const BotDetailView: React.FC = () => {
  const navigate = useNavigate();
  const [showToken, setShowToken] = React.useState<boolean>(false);
  const [isRotating, setIsRotating] = React.useState<boolean>(false);
  const [dummyToken, setDummyToken] = React.useState<string>(
    "bt_8kL2m9Pq0Xz_v1_882941573620459",
  );

  const form = useForm<BotFormValues>({
    resolver: zodResolver(botSchema),
    defaultValues: {
      username: "nexus_bot",
      firstName: "Nexus Core",
      description: "Primary integration for automated channel moderation.",
    },
  });

  const { isDirty, isSubmitting, isValid } = form.formState;

  const onSubmit = async (data: BotFormValues): Promise<void> => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      form.reset(data);
      toast.success("Settings updated successfully");
    } catch {
      toast.error("Failed to save changes");
    }
  };

  const handleRefreshToken = async (): Promise<void> => {
    setIsRotating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newToken: string = `bt_${Math.random().toString(36).substring(7)}_${Date.now()}`;
      setDummyToken(newToken);
      toast.success("API Token refreshed");
    } catch {
      toast.error("Could not refresh token");
    } finally {
      setIsRotating(false);
    }
  };

  const handleDeleteBot = (): void => {
    toast.info("Deleting bot...");
    setTimeout((): void => {
      toast.success("Bot permanently deleted");
      navigate({ to: "/bots" });
    }, 1000);
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-background selection:bg-primary/10">
      <div className="container mx-auto max-w-2xl px-6 py-8 pb-32">
        <Button
          variant="ghost"
          onClick={(): void => {
            navigate({ to: "/bots" });
          }}
          className="mb-8 -ml-2 text-muted-foreground hover:text-foreground h-8 px-2 text-[13px] hover:bg-transparent"
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
                  value={dummyToken}
                  className="bg-muted/10 border-muted/20 font-mono text-[12px] h-11 rounded-xl pr-24 focus:ring-0"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground/40"
                    onClick={(): void => setShowToken(!showToken)}
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
                    className="h-8 w-8 text-muted-foreground/40"
                    onClick={(): void => {
                      navigator.clipboard.writeText(dummyToken);
                      toast.success("Token copied");
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
                className="w-fit h-9 text-[12px] font-bold rounded-lg border-muted/20 hover:bg-muted/10"
              >
                <RefreshCw
                  className={cn(
                    "mr-2 h-3.5 w-3.5 text-primary/60",
                    isRotating && "animate-spin",
                  )}
                />
                Refresh Token
              </Button>
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
                            className="bg-muted/10 border-muted/20 h-10 rounded-lg font-mono text-[13px]"
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
                    "h-10 px-6 rounded-xl font-bold text-[13px] transition-all duration-200 shadow-lg shadow-primary/10",
                    !isDirty && "opacity-40 grayscale-[0.5]",
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
