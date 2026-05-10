import { type ReactNode, useMemo, useEffect, useState } from "react";
import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import {
  Image as ImageIcon,
  Users,
  Megaphone,
  Shield,
  ShieldOff,
  Crown,
  UserMinus,
  Settings,
  Link2,
  Save,
  Globe,
  Lock,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import type { channelContentUpdateRoleMutation } from "./__generated__/channelContentUpdateRoleMutation.graphql";
import type { channelContentRemoveMemberMutation } from "./__generated__/channelContentRemoveMemberMutation.graphql";
import type { channelContentUpdateMetadataMutation } from "./__generated__/channelContentUpdateMetadataMutation.graphql";
import type { channelContentGenerateInviteLinkMutation } from "./__generated__/channelContentGenerateInviteLinkMutation.graphql";
import type {
  channelContentQuery,
  channelContentQuery$data,
} from "./__generated__/channelContentQuery.graphql";

const channelSettingsSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(64),
    slug: z
      .string()
      .max(32)
      .regex(/^[a-zA-Z0-9_]*$/, "Only letters, numbers and underscores")
      .or(z.literal("")),
    visibility: z.enum(["public", "private"]),
  })
  .refine(
    (data: { visibility: string; slug: string }): boolean => {
      if (data.visibility === "public") {
        return data.slug.trim().length > 0;
      }
      return true;
    },
    {
      message: "Public link is required for public channels",
      path: ["slug"],
    },
  );

type ChannelSettingsValues = z.infer<typeof channelSettingsSchema>;

type ChatMember = NonNullable<
  NonNullable<
    Extract<
      channelContentQuery$data["chat"],
      { readonly __typename: "Chat" }
    >["members"]
  >[number]
>;

const ChannelQuery = graphql`
  query channelContentQuery($id: ID!) {
    chat(id: $id) {
      __typename
      ... on Chat {
        id
        title
        slug
        photoUrl
        membersCount
        myRole
        members {
          user {
            id
            displayName
            firstName
            photoUrl
          }
          role
        }
      }
    }
    chatInvites(chatID: $id) {
      __typename
      ... on ChatInvitesList {
        invites {
          inviteLink
        }
      }
    }
  }
`;

const UpdateMetadataMutation = graphql`
  mutation channelContentUpdateMetadataMutation(
    $id: ID!
    $title: String
    $slug: String
  ) {
    updateChatMetadata(id: $id, title: $title, slug: $slug) {
      __typename
      ... on Chat {
        id
        title
        slug
      }
    }
  }
`;

const UpdateRoleMutation = graphql`
  mutation channelContentUpdateRoleMutation(
    $chatID: ID!
    $userID: ID!
    $role: String!
  ) {
    updateMemberRole(chatID: $chatID, userID: $userID, role: $role) {
      __typename
      ... on SuccessResult {
        success
      }
    }
  }
`;

const RemoveMemberMutation = graphql`
  mutation channelContentRemoveMemberMutation($chatID: ID!, $userID: ID!) {
    removeChatMember(chatID: $chatID, userID: $userID) {
      __typename
      ... on SuccessResult {
        success
      }
    }
  }
`;

const GenerateInviteLinkMutation = graphql`
  mutation channelContentGenerateInviteLinkMutation($id: ID!) {
    exportChatInvite(chatID: $id) {
      __typename
      ... on ChatInvite {
        code
        inviteLink
      }
    }
  }
`;

const formatInviteLink = (rawLink: string | null | undefined): string => {
  if (!rawLink) return "";
  if (rawLink.startsWith("http")) return rawLink;

  const baseUrl: string =
    typeof window !== "undefined" ? window.location.origin : "";
  const cleanBase: string = baseUrl.replace(/\/+$/, "");
  const cleanPath: string = rawLink
    .replace(/^\/?join\//, "")
    .replace(/^\/+/, "");

  return `${cleanBase}/join/${cleanPath}`;
};

const generateSlug = (name: string): string => {
  const slug: string = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/^-+|-+$/g, "");
  return slug || "channel";
};

interface ChannelContentProps {
  id: string;
  isPreview?: boolean;
}

export function ChannelContent({
  id,
  isPreview,
}: ChannelContentProps): ReactNode {
  const data: channelContentQuery$data = useLazyLoadQuery<channelContentQuery>(
    ChannelQuery,
    { id },
  );

  const [commitUpdateMetadata] =
    useMutation<channelContentUpdateMetadataMutation>(UpdateMetadataMutation);
  const [commitUpdateRole] =
    useMutation<channelContentUpdateRoleMutation>(UpdateRoleMutation);
  const [commitRemoveMember] =
    useMutation<channelContentRemoveMemberMutation>(RemoveMemberMutation);
  const [commitGenerateLink, isGeneratingLink] =
    useMutation<channelContentGenerateInviteLinkMutation>(
      GenerateInviteLinkMutation,
    );

  const chat = data.chat;
  const invitesData = data.chatInvites;

  const [inviteLinkState, setInviteLinkState] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect((): void => {
    if (
      invitesData?.__typename === "ChatInvitesList" &&
      invitesData.invites.length > 0
    ) {
      setInviteLinkState(invitesData.invites[0].inviteLink);
    }
  }, [invitesData]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty, errors, isSubmitting, isValid },
  } = useForm<ChannelSettingsValues>({
    resolver: zodResolver(channelSettingsSchema),
    mode: "onChange",
    defaultValues: {
      title: chat?.__typename === "Chat" ? chat.title : "",
      slug: (chat?.__typename === "Chat" ? chat.slug : "") ?? "",
      visibility:
        chat?.__typename === "Chat" && chat.slug ? "public" : "private",
    },
  });

  const visibility: "public" | "private" = watch("visibility");
  const channelTitle: string = watch("title");

  useEffect((): void => {
    if (visibility === "public" && channelTitle) {
      setValue("slug", generateSlug(channelTitle), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [channelTitle, visibility, setValue]);

  useEffect((): void => {
    if (chat?.__typename === "Chat") {
      reset({
        title: chat.title,
        slug: chat.slug ?? "",
        visibility: chat.slug ? "public" : "private",
      });
    }
  }, [chat, reset]);

  const fullInviteLink: string = useMemo(
    (): string => formatInviteLink(inviteLinkState),
    [inviteLinkState],
  );

  const sortedMembers: ChatMember[] = useMemo((): ChatMember[] => {
    if (!chat || chat.__typename !== "Chat" || !chat.members) return [];
    const weights: Record<string, number> = { owner: 3, admin: 2, member: 1 };
    return [...chat.members]
      .filter((m: ChatMember | null): m is ChatMember => m !== null)
      .sort(
        (a: ChatMember, b: ChatMember): number =>
          (weights[b.role.toLowerCase()] || 0) -
          (weights[a.role.toLowerCase()] || 0),
      );
  }, [chat]);

  if (!chat || chat.__typename !== "Chat") return null;

  const isSelfAdmin: boolean =
    chat.myRole.toLowerCase() === "owner" ||
    chat.myRole.toLowerCase() === "admin";

  const onSaveSettings = (values: ChannelSettingsValues): void => {
    const finalSlug: string =
      values.visibility === "private" ? "" : values.slug;
    commitUpdateMetadata({
      variables: { id: chat.id, title: values.title, slug: finalSlug },
      onCompleted: (
        response: channelContentUpdateMetadataMutation["response"],
      ): void => {
        if (response.updateChatMetadata?.__typename === "Chat") {
          toast.success("Channel updated successfully");
          reset(values);
        }
      },
    });
  };

  const handleCopyLink = (): void => {
    if (!fullInviteLink) return;
    navigator.clipboard.writeText(fullInviteLink);
    setIsCopied(true);
    setTimeout((): void => setIsCopied(false), 2000);
    toast.success("Invite link copied");
  };

  const handleRegenerateLink = (): void => {
    commitGenerateLink({
      variables: { id: chat.id },
      onCompleted: (
        response: channelContentGenerateInviteLinkMutation["response"],
      ): void => {
        if (response.exportChatInvite?.__typename === "ChatInvite") {
          setInviteLinkState(response.exportChatInvite.inviteLink);
          toast.success("Link regenerated");
        }
      },
    });
  };

  const handleToggleAdmin = (
    userID: string,
    currentRole: string,
    userName: string,
  ): void => {
    const newRole: string =
      currentRole.toLowerCase() === "admin" ? "member" : "admin";
    commitUpdateRole({
      variables: { chatID: chat.id, userID, role: newRole },
      onCompleted: (
        res: channelContentUpdateRoleMutation["response"],
      ): void => {
        if (res.updateMemberRole?.__typename === "SuccessResult")
          toast.success(`${userName} updated`);
      },
    });
  };

  const handleKickMember = (userID: string, userName: string): void => {
    commitRemoveMember({
      variables: { chatID: chat.id, userID },
      onCompleted: (
        res: channelContentRemoveMemberMutation["response"],
      ): void => {
        if (res.removeChatMember?.__typename === "SuccessResult")
          toast.success(`${userName} removed`);
      },
    });
  };

  return (
    <div className="flex flex-col w-full h-full max-h-[85vh] bg-background select-none overflow-hidden">
      <ScrollArea className="flex-1 w-full h-full">
        <div className="relative h-28 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent shrink-0">
          <div className="absolute inset-0 bg-grid-white/5 opacity-30" />
        </div>

        <div className="px-6 pb-6 -mt-12 relative z-10 flex flex-col">
          <div className="flex items-start gap-4 mb-6">
            <UserAvatar
              src={chat.photoUrl ?? null}
              fallback={chat.title}
              size={80}
              className="h-20 w-20 border-4 border-background shadow-lg rounded-3xl shrink-0 object-cover"
            />
            <div className="flex flex-col min-w-0 pt-1">
              <h3 className="text-xl font-bold tracking-tight text-foreground truncate leading-tight">
                {chat.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5">
                {chat.slug && (
                  <div className="flex items-center gap-1 text-primary/80">
                    <Link2 className="w-3 h-3" />
                    <span className="text-xs font-semibold">@{chat.slug}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="h-4 text-[9px] uppercase font-bold px-1.5 tracking-tighter"
                  >
                    Channel
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {chat.membersCount} subscribers
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!isPreview && (
            <Tabs defaultValue="members" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-10 rounded-xl mb-4">
                <TabsTrigger
                  value="members"
                  className="gap-2 text-[11px] font-semibold rounded-lg"
                >
                  <Users className="w-3 h-3" /> Subs
                </TabsTrigger>
                <TabsTrigger
                  value="media"
                  className="gap-2 text-[11px] font-semibold rounded-lg"
                >
                  <ImageIcon className="w-3 h-3" /> Media
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  disabled={!isSelfAdmin}
                  className="gap-2 text-[11px] font-semibold rounded-lg"
                >
                  <Settings className="w-3 h-3" /> Config
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="members"
                className="mt-0 focus-visible:outline-none"
              >
                <div className="grid gap-1">
                  {sortedMembers.map((m: ChatMember): ReactNode => {
                    const name: string =
                      m.user.displayName || m.user.firstName || "Unknown";
                    const role: string = m.role.toLowerCase();
                    return (
                      <ContextMenu key={m.user.id}>
                        <ContextMenuTrigger>
                          <div className="flex items-center gap-3 p-2 rounded-xl transition-all hover:bg-secondary/40 cursor-default group">
                            <UserAvatar
                              src={m.user.photoUrl ?? null}
                              fallback={name}
                              size={36}
                              className="h-9 w-9 rounded-full shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium truncate block text-foreground">
                                {name}
                              </span>
                            </div>
                            {role === "owner" && (
                              <Badge
                                variant="outline"
                                className="text-[9px] border-amber-500/20 text-amber-600 bg-amber-500/5 px-1"
                              >
                                <Crown className="w-2.5 h-2.5 mr-0.5" /> Owner
                              </Badge>
                            )}
                            {role === "admin" && (
                              <Badge
                                variant="outline"
                                className="text-[9px] border-primary/20 text-primary bg-primary/5 px-1"
                              >
                                <Shield className="w-2.5 h-2.5 mr-0.5" /> Admin
                              </Badge>
                            )}
                          </div>
                        </ContextMenuTrigger>
                        {isSelfAdmin && role !== "owner" && (
                          <ContextMenuContent className="w-52 rounded-xl shadow-xl">
                            <ContextMenuItem
                              className="gap-3 py-2.5"
                              onClick={(): void =>
                                handleToggleAdmin(m.user.id, role, name)
                              }
                            >
                              {role === "admin" ? (
                                <ShieldOff className="w-4 h-4" />
                              ) : (
                                <Shield className="w-4 h-4" />
                              )}
                              {role === "admin"
                                ? "Dismiss admin"
                                : "Promote to admin"}
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              className="gap-3 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/5"
                              onClick={(): void =>
                                handleKickMember(m.user.id, name)
                              }
                            >
                              <UserMinus className="w-4 h-4" /> Kick member
                            </ContextMenuItem>
                          </ContextMenuContent>
                        )}
                      </ContextMenu>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent
                value="media"
                className="mt-0 focus-visible:outline-none"
              >
                <div className="h-32 flex flex-col items-center justify-center text-muted-foreground/30 border-2 border-dashed border-muted/20 rounded-2xl">
                  <Megaphone className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs font-semibold">No shared media</p>
                </div>
              </TabsContent>

              {isSelfAdmin && (
                <TabsContent
                  value="settings"
                  className="mt-0 focus-visible:outline-none"
                >
                  <form
                    onSubmit={handleSubmit(onSaveSettings)}
                    className="space-y-5"
                  >
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                          Channel Name
                        </Label>
                        <Input
                          {...register("title")}
                          className={`bg-secondary/20 border-secondary/40 rounded-xl h-10 ${errors.title ? "border-destructive/50" : ""}`}
                        />
                        {errors.title && (
                          <div className="flex items-center gap-1 px-1 text-destructive">
                            <AlertCircle className="w-3 h-3" />
                            <p className="text-[10px] font-medium">
                              {errors.title.message}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                          Type
                        </Label>
                        <RadioGroup
                          value={visibility}
                          onValueChange={(v: string): void => {
                            setValue("visibility", v as "public" | "private", {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }}
                          className="grid grid-cols-2 gap-2"
                        >
                          <Label
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${visibility === "public" ? "border-primary bg-primary/5" : "border-secondary/20 bg-secondary/5"}`}
                          >
                            <RadioGroupItem
                              value="public"
                              className="sr-only"
                            />
                            <div className="flex items-center gap-2">
                              <Globe
                                className={`w-3.5 h-3.5 ${visibility === "public" ? "text-primary" : "text-muted-foreground"}`}
                              />
                              <span className="text-xs font-bold">Public</span>
                            </div>
                            {visibility === "public" && (
                              <Check className="w-3.5 h-3.5 text-primary" />
                            )}
                          </Label>
                          <Label
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${visibility === "private" ? "border-primary bg-primary/5" : "border-secondary/20 bg-secondary/5"}`}
                          >
                            <RadioGroupItem
                              value="private"
                              className="sr-only"
                            />
                            <div className="flex items-center gap-2">
                              <Lock
                                className={`w-3.5 h-3.5 ${visibility === "private" ? "text-primary" : "text-muted-foreground"}`}
                              />
                              <span className="text-xs font-bold">Private</span>
                            </div>
                            {visibility === "private" && (
                              <Check className="w-3.5 h-3.5 text-primary" />
                            )}
                          </Label>
                        </RadioGroup>
                      </div>

                      {visibility === "public" && (
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                            Public Link
                          </Label>
                          <div
                            className={`flex items-center rounded-xl bg-secondary/20 border h-10 overflow-hidden ${errors.slug ? "border-destructive/50" : "border-secondary/40"}`}
                          >
                            <span className="flex items-center justify-center w-8 h-full bg-secondary/20 text-muted-foreground text-xs font-bold border-r border-secondary/40">
                              @
                            </span>
                            <input
                              {...register("slug")}
                              className="flex-1 bg-transparent px-3 text-xs outline-none w-full h-full"
                              placeholder="link"
                            />
                          </div>
                        </div>
                      )}

                      {visibility === "private" && (
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                            Invite Link
                          </Label>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 flex items-center rounded-xl bg-secondary/20 border border-secondary/40 h-10 overflow-hidden px-3">
                              <span className="text-[10px] text-muted-foreground truncate w-full font-mono">
                                {fullInviteLink || "..."}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCopyLink}
                              className="w-10 h-10 p-0 shrink-0 rounded-xl"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleRegenerateLink}
                              disabled={isGeneratingLink}
                              className="w-10 h-10 p-0 shrink-0 rounded-xl"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${isGeneratingLink ? "animate-spin" : ""}`}
                              />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={!isDirty || !isValid || isSubmitting}
                      className="w-full rounded-xl h-11 font-bold shadow-lg shadow-primary/20"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}{" "}
                      Save Changes
                    </Button>
                  </form>
                </TabsContent>
              )}
            </Tabs>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
