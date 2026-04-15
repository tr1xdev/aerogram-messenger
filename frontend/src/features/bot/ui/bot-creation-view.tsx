import * as React from "react";
import { useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Bot,
  ChevronLeft,
  Sparkles,
  Copy,
  CheckCircle2,
  Camera,
  RefreshCw,
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
import { graphql, useMutation } from "react-relay";
import { cn } from "@/lib/utils";
import type { botCreationViewMutation } from "./__generated__/botCreationViewMutation.graphql";
import type { botCreationViewUploadAvatarMutation } from "./__generated__/botCreationViewUploadAvatarMutation.graphql";

const CreateBotMutation = graphql`
  mutation botCreationViewMutation(
    $username: String!
    $firstName: String!
    $lastName: String
    $description: String
  ) {
    createBot(
      username: $username
      firstName: $firstName
      lastName: $lastName
      description: $description
    ) {
      __typename
      ... on CreateBotPayload {
        botToken
        user {
          id
          username
        }
      }
      ... on ValidationError {
        message
        field
      }
      ... on ForbiddenError {
        message
      }
      ... on InternalError {
        message
      }
    }
  }
`;

const UploadAvatarMutation = graphql`
  mutation botCreationViewUploadAvatarMutation($userId: ID!, $file: Upload!) {
    uploadAvatar(userId: $userId, file: $file) {
      id
      photoUrl
    }
  }
`;

const botSchema = z.object({
  username: z
    .string()
    .min(3, "Min 3 chars")
    .max(32, "Max 32 chars")
    .endsWith("bot", "Must end with 'bot'")
    .regex(/^[a-zA-Z0-9_]+$/, "Alphanumeric and underscores only"),
  firstName: z.string().min(1, "Display name is required").max(64),
  description: z
    .string()
    .max(256, "Max 256 chars")
    .optional()
    .or(z.literal("")),
});

type BotFormValues = z.infer<typeof botSchema>;

export const BotCreationView: React.FC = (): React.ReactNode => {
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [tokenToShow, setTokenToShow] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<boolean>(false);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);

  const [commitCreate, isCreating] =
    useMutation<botCreationViewMutation>(CreateBotMutation);
  const [commitUpload, isUploading] =
    useMutation<botCreationViewUploadAvatarMutation>(UploadAvatarMutation);

  const form = useForm<BotFormValues>({
    resolver: zodResolver(botSchema),
    defaultValues: { username: "", firstName: "", description: "" },
    mode: "onChange",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = (values: BotFormValues): void => {
    commitCreate({
      variables: {
        username: values.username,
        firstName: values.firstName,
        lastName: null,
        description: values.description || null,
      },
      onCompleted: (response: botCreationViewMutation["response"]): void => {
        const result = response.createBot;

        if (result?.__typename === "CreateBotPayload") {
          const botId: string = result.user.id;
          const token: string | null = result.botToken ?? null;

          if (avatarFile) {
            const rawId: string = window.atob(botId).split(":").pop() ?? botId;

            commitUpload({
              variables: { userId: rawId, file: null },
              uploadables: { file: avatarFile },
              onCompleted: (): void => {
                setTokenToShow(token);
                toast.success("Bot created and avatar uploaded");
              },
              onError: (): void => {
                setTokenToShow(token);
                toast.error("Bot created, but avatar upload failed");
              },
            });
          } else {
            setTokenToShow(token);
            toast.success("Bot created successfully");
          }
        } else if (result?.__typename === "ValidationError" && result.field) {
          form.setError(result.field as Path<BotFormValues>, {
            message: result.message,
          });
        } else if (
          result?.__typename === "InternalError" ||
          result?.__typename === "ForbiddenError"
        ) {
          toast.error(result.message);
        }
      },
      onError: (): void => {
        toast.error("Something went wrong. Please try again.");
      },
    });
  };

  const copyToken = (): void => {
    if (tokenToShow) {
      navigator.clipboard.writeText(tokenToShow);
      setCopied(true);
      setTimeout((): void => setCopied(false), 2000);
    }
  };

  const isLoading = isCreating || isUploading;

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-background selection:bg-primary/20">
      <div className="container mx-auto max-w-5xl px-6 py-8 pb-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={(): void => {
            navigate({ to: "/bots" });
          }}
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Bots
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
          <section className="space-y-8">
            <div>
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tighter">
                Create Bot
              </h1>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                    Avatar
                  </FormLabel>
                  <div className="relative h-20 w-20 group">
                    <div className="h-20 w-20 rounded-2xl bg-muted/30 border border-muted/20 flex items-center justify-center overflow-hidden transition-all shadow-sm">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          className="h-full w-full object-cover"
                          alt="Preview"
                        />
                      ) : (
                        <Bot className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={(): void => fileInputRef.current?.click()}
                      className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-2xl opacity-0 transition-opacity cursor-pointer",
                        !isLoading && "group-hover:opacity-100",
                        isLoading && "opacity-100 bg-black/20",
                      )}
                    >
                      {isLoading ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        <Camera className="h-5 w-5" />
                      )}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }): React.ReactElement => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                        Display Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="My Bot"
                          disabled={isLoading}
                          className="bg-muted/30 border-none h-12 rounded-xl"
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
                  render={({ field }): React.ReactElement => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                        Username
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-mono font-bold">
                            @
                          </span>
                          <Input
                            placeholder="name_bot"
                            disabled={isLoading}
                            className="pl-10 bg-muted/30 border-none h-12 rounded-xl font-mono"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }): React.ReactElement => (
                    <FormItem>
                      <div className="flex justify-between">
                        <FormLabel className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                          Description
                        </FormLabel>
                        <span className="text-[9px] font-mono opacity-40">
                          {field.value?.length || 0}/256
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="What does this bot do?"
                          disabled={isLoading}
                          className="bg-muted/30 border-none min-h-[100px] rounded-xl resize-none p-4"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading || !form.formState.isValid}
                  className="w-full sm:w-auto px-12 h-12 rounded-xl font-bold cursor-pointer transition-all hover:scale-[1.01]"
                >
                  {isLoading ? "Processing..." : "Create Bot"}
                </Button>
              </form>
            </Form>
          </section>

          <aside className="hidden lg:block sticky top-8">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-4 text-center">
              Preview
            </div>
            <Card className="border border-muted/20 bg-muted/5 rounded-[24px] overflow-hidden backdrop-blur-sm">
              <CardContent className="pt-8 pb-8 px-6 flex flex-col items-center text-center">
                <div className="h-24 w-24 rounded-[32px] bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6 shadow-xl shadow-primary/20 overflow-hidden">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      className="h-full w-full object-cover"
                      alt="Preview"
                    />
                  ) : (
                    <Bot className="h-12 w-12 text-primary-foreground" />
                  )}
                </div>

                <h3 className="text-xl font-black tracking-tight w-full truncate">
                  {form.watch("firstName") || "Unnamed Bot"}
                </h3>
                <p className="text-primary font-mono text-xs mt-1 font-bold w-full truncate">
                  @{form.watch("username") || "username"}
                </p>

                <Separator className="my-6 bg-foreground/5" />

                <div className="w-full">
                  <p className="text-[12px] leading-relaxed text-muted-foreground/70 italic font-medium whitespace-pre-wrap break-words line-clamp-4 overflow-hidden">
                    {form.watch("description") || "No description provided."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <Dialog
        open={!!tokenToShow}
        onOpenChange={(open: boolean): void => {
          if (!open) {
            setTokenToShow(null);
            navigate({ to: "/bots" });
          }
        }}
      >
        <DialogContent className="rounded-[24px] border-none bg-card p-6">
          <DialogHeader className="items-center text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-2" />
            <DialogTitle className="text-2xl font-black">Success</DialogTitle>
            <DialogDescription>
              Copy the token below. You won't see it again.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 p-4 bg-muted/40 rounded-xl relative group border border-muted/20">
            <code className="text-xs font-mono break-all font-bold pr-8">
              {tokenToShow}
            </code>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 cursor-pointer"
              onClick={copyToken}
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <DialogFooter className="mt-6">
            <Button
              className="w-full h-12 rounded-xl font-bold cursor-pointer"
              onClick={(): void => {
                navigate({ to: "/bots" });
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
