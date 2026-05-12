import { type ReactNode, useTransition, useState } from "react";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Globe,
  Lock,
  Loader2,
  Copy,
  RefreshCw,
  Check,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { channelSettingsUpdateMetadataMutation } from "./__generated__/channelSettingsUpdateMetadataMutation.graphql";
import type { channelSettingsExportInviteMutation } from "./__generated__/channelSettingsExportInviteMutation.graphql";

const UpdateMetadataMutation = graphql`
  mutation channelSettingsUpdateMetadataMutation(
    $id: ID!
    $title: String
    $slug: String
  ) {
    updateChatMetadata(id: $id, title: $title, slug: $slug) {
      ... on Chat {
        id
        title
        slug
      }
    }
  }
`;

const ExportInviteMutation = graphql`
  mutation channelSettingsExportInviteMutation($chatID: ID!) {
    exportChatInvite(chatID: $chatID) {
      ... on ChatInvite {
        code
        inviteLink
      }
    }
  }
`;

const settingsSchema = z.object({
  type: z.enum(["public", "private"]),
  title: z.string().min(3, "Title too short"),
  slug: z.string().optional().nullable(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface Props {
  chat: { id: string; title: string; slug: string | null };
  invite: { inviteLink: string; code: string } | null;
}

export function ChannelSettings({
  chat,
  invite: initialInvite,
}: Props): ReactNode {
  const [copied, setCopied] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [localInvite, setLocalInvite] = useState(initialInvite);

  const [commitUpdate] = useMutation<channelSettingsUpdateMetadataMutation>(
    UpdateMetadataMutation,
  );

  const [commitExport] =
    useMutation<channelSettingsExportInviteMutation>(ExportInviteMutation);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: {
      type: chat.slug ? "public" : "private",
      title: chat.title,
      slug: chat.slug ?? "",
    },
  });

  const channelType = form.watch("type");
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const onUpdateMetadata = (values: SettingsFormValues): void => {
    const finalSlug = values.type === "private" ? "" : values.slug;
    startTransition(() => {
      commitUpdate({
        variables: { id: chat.id, title: values.title, slug: finalSlug },
        onCompleted: (res): void => {
          if (res.updateChatMetadata?.id) {
            toast.success("Settings updated");
            form.reset({ ...values });
          }
        },
      });
    });
  };

  const handleCopy = (text: string): void => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied");
  };

  const onRotateInvite = (): void => {
    commitExport({
      variables: { chatID: chat.id },
      onCompleted: (res): void => {
        const invite = res.exportChatInvite;

        if (invite && "code" in invite && invite.code && invite.inviteLink) {
          setLocalInvite({
            code: invite.code,
            inviteLink: invite.inviteLink,
          });
          toast.success("Invite link rotated");
        }
      },
    });
  };

  const currentInvite = localInvite;
  const inviteUrl = currentInvite?.inviteLink
    ? currentInvite.inviteLink.startsWith("http")
      ? currentInvite.inviteLink
      : `${baseUrl}${currentInvite.inviteLink}`
    : "";

  return (
    <div className="flex flex-col h-full bg-background p-6 space-y-8 select-none">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-secondary rounded-2xl text-primary font-bold">
          ⚙️
        </div>
        <div>
          <h3 className="text-lg font-bold tracking-tight text-foreground">
            Channel Settings
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            Manage visibility
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onUpdateMetadata)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground/70">
                  Visibility
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(val: "public" | "private") => {
                      field.onChange(val);
                      if (val === "private")
                        form.setValue("slug", "", { shouldDirty: true });
                    }}
                    value={field.value}
                    className="grid grid-cols-2 gap-2"
                  >
                    <Label
                      className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition-colors ${field.value === "public" ? "border-primary bg-primary/5" : "border-muted bg-secondary/10"}`}
                    >
                      <RadioGroupItem value="public" className="sr-only" />
                      <Globe
                        className={`w-4 h-4 ${field.value === "public" ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span className="text-sm font-semibold">Public</span>
                    </Label>
                    <Label
                      className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition-colors ${field.value === "private" ? "border-primary bg-primary/5" : "border-muted bg-secondary/10"}`}
                    >
                      <RadioGroupItem value="private" className="sr-only" />
                      <Lock
                        className={`w-4 h-4 ${field.value === "private" ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span className="text-sm font-semibold">Private</span>
                    </Label>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground/70">
                  Channel Name
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="bg-secondary/20 h-10 rounded-lg font-medium"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {channelType === "public" && (
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[10px] font-bold uppercase text-muted-foreground/70">
                    Public Link
                  </FormLabel>
                  <div className="flex h-10 items-center bg-secondary/20 rounded-lg px-3 border border-transparent focus-within:border-primary/30">
                    <span className="text-muted-foreground/50 text-xs font-medium mr-1">
                      /join/
                    </span>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        className="border-none bg-transparent h-full p-0 focus-visible:ring-0 font-semibold text-sm"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {channelType === "private" && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground/70">
                Invite Link
              </Label>
              <div className="flex items-center bg-secondary/20 rounded-lg p-1 px-3 h-10 border border-muted/20">
                <LinkIcon className="w-3.5 h-3.5 mr-2 text-muted-foreground/40" />
                <span className="text-[11px] truncate flex-1 font-mono text-muted-foreground/80">
                  {inviteUrl}
                </span>
                <div className="flex gap-1 ml-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md"
                    onClick={() => handleCopy(inviteUrl)}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md"
                    onClick={onRotateInvite}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-10 font-bold mt-4 rounded-lg"
            disabled={!form.formState.isDirty || isPending}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Save Settings"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
