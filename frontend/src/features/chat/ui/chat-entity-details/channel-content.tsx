import { type ReactNode, useMemo, useEffect } from "react";
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
  Trash2,
  Save,
  Globe,
  Lock,
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
import { Separator } from "@/components/ui/separator";
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
import type { channelContentDeleteChatMutation } from "./__generated__/channelContentDeleteChatMutation.graphql";
import type {
  channelContentQuery,
  channelContentQuery$data,
} from "./__generated__/channelContentQuery.graphql";

const channelSettingsSchema = z.object({
  title: z.string().min(1, "Title is required").max(64),
  slug: z
    .string()
    .max(32)
    .regex(/^[a-zA-Z0-9_]*$/, "Only letters, numbers and underscores")
    .or(z.literal("")),
  visibility: z.enum(["public", "private"]),
});

type ChannelSettingsValues = z.infer<typeof channelSettingsSchema>;
type ChatData = Extract<
  channelContentQuery$data["chat"],
  { readonly __typename: "Chat" }
>;
type ChatMember = NonNullable<NonNullable<ChatData["members"]>[number]>;

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
      success
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

const DeleteChatMutation = graphql`
  mutation channelContentDeleteChatMutation($id: ID!, $forEveryone: Boolean) {
    deleteChat(id: $id, forEveryone: $forEveryone) {
      __typename
      ... on SuccessResult {
        success
      }
    }
  }
`;

export function ChannelContent({
  id,
  isPreview,
}: {
  id: string;
  isPreview?: boolean;
}): ReactNode {
  const data = useLazyLoadQuery<channelContentQuery>(ChannelQuery, { id });
  const [commitUpdateMetadata] =
    useMutation<channelContentUpdateMetadataMutation>(UpdateMetadataMutation);
  const [commitUpdateRole] =
    useMutation<channelContentUpdateRoleMutation>(UpdateRoleMutation);
  const [commitRemoveMember] =
    useMutation<channelContentRemoveMemberMutation>(RemoveMemberMutation);
  const [commitDeleteChat] =
    useMutation<channelContentDeleteChatMutation>(DeleteChatMutation);

  const chat = data.chat;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty, errors, isSubmitting },
  } = useForm<ChannelSettingsValues>({
    resolver: zodResolver(channelSettingsSchema),
    defaultValues: {
      title: chat?.__typename === "Chat" ? chat.title : "",
      slug: (chat?.__typename === "Chat" ? chat.slug : "") ?? "",
      visibility:
        chat?.__typename === "Chat" && chat.slug ? "public" : "private",
    },
  });

  const visibility: "public" | "private" = watch("visibility");

  useEffect(() => {
    if (chat?.__typename === "Chat") {
      reset({
        title: chat.title,
        slug: chat.slug ?? "",
        visibility: chat.slug ? "public" : "private",
      });
    }
  }, [chat, reset]);

  const sortedMembers = useMemo((): ChatMember[] => {
    if (!chat || chat.__typename !== "Chat" || !chat.members) return [];
    const weights: Record<string, number> = { owner: 3, admin: 2, member: 1 };
    return [...chat.members]
      .filter((m): m is ChatMember => m !== null)
      .sort(
        (a, b) =>
          (weights[b.role.toLowerCase()] || 0) -
          (weights[a.role.toLowerCase()] || 0),
      );
  }, [chat]);

  if (!chat || chat.__typename !== "Chat") return null;

  const isSelfAdmin: boolean =
    chat.myRole.toLowerCase() === "owner" ||
    chat.myRole.toLowerCase() === "admin";

  const onSaveSettings = (values: ChannelSettingsValues): void => {
    const finalSlug = values.visibility === "private" ? "" : values.slug;

    commitUpdateMetadata({
      variables: {
        id: chat.id,
        title: values.title,
        slug: finalSlug,
      },
      onCompleted: (response) => {
        if (response.updateChatMetadata?.__typename === "Chat") {
          toast.success("Channel updated successfully");
          reset(values);
        } else {
          toast.error("Failed to update channel");
        }
      },
      onError: () => {
        toast.error("An error occurred while saving");
      },
    });
  };

  const handleDeleteChannel = (): void => {
    if (
      !confirm(
        "Are you sure you want to delete this channel? This action cannot be undone.",
      )
    )
      return;

    commitDeleteChat({
      variables: { id: chat.id, forEveryone: true },
      onCompleted: (response) => {
        if (response.deleteChat?.__typename === "SuccessResult") {
          toast.success("Channel deleted");
          window.location.href = "/";
        }
      },
    });
  };

  const handleToggleAdmin = (
    userID: string,
    currentRole: string,
    userName: string,
  ): void => {
    const newRole = currentRole.toLowerCase() === "admin" ? "member" : "admin";
    commitUpdateRole({
      variables: { chatID: chat.id, userID, role: newRole },
      optimisticUpdater: (store) => {
        const chatProxy = store.get(chat.id);
        if (!chatProxy) return;
        const members = chatProxy.getLinkedRecords("members");
        if (!members) return;
        const targetMember = members.find(
          (m) => m.getLinkedRecord("user")?.getValue("id") === userID,
        );
        if (targetMember) {
          targetMember.setValue(newRole.toUpperCase(), "role");
        }
      },
      onCompleted: (res) => {
        if (res.updateMemberRole?.success)
          toast.success(`${userName} is now ${newRole}`);
      },
    });
  };

  const handleKickMember = (userID: string, userName: string): void => {
    commitRemoveMember({
      variables: { chatID: chat.id, userID },
      updater: (store) => {
        const chatProxy = store.get(chat.id);
        const members = chatProxy?.getLinkedRecords("members");
        if (chatProxy && members) {
          const nextMembers = members.filter(
            (m) => m.getLinkedRecord("user")?.getValue("id") !== userID,
          );
          chatProxy.setLinkedRecords(nextMembers, "members");
          const count = chatProxy.getValue("membersCount") as number;
          chatProxy.setValue(Math.max(0, count - 1), "membersCount");
        }
      },
      onCompleted: (res) => {
        if (res.removeChatMember?.__typename === "SuccessResult")
          toast.success(`${userName} removed`);
      },
    });
  };

  return (
    <div className="flex flex-col w-full h-full bg-background select-none shrink-0 overflow-hidden">
      <div className="relative h-40 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent shrink-0">
        <div className="absolute inset-0 bg-grid-white/5 opacity-30" />
      </div>

      <div className="px-6 pb-6 -mt-16 relative z-10 flex-1 flex flex-col min-h-0">
        <div className="flex flex-col items-center gap-4 shrink-0">
          <UserAvatar
            src={chat.photoUrl ?? null}
            fallback={chat.title}
            size={128}
            className="h-32 w-32 border-[4px] border-background shadow-xl rounded-[40px] shrink-0 object-cover"
          />
          <div className="flex flex-col items-center text-center w-full">
            <h3 className="text-2xl font-bold tracking-tight text-foreground truncate w-full px-4">
              {chat.title}
            </h3>
            {chat.slug && (
              <div className="flex items-center justify-center gap-1.5 mt-1 text-primary/80">
                <Link2 className="w-3.5 h-3.5" />
                <p className="text-sm font-medium">@{chat.slug}</p>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="secondary"
                className="h-5 text-[10px] uppercase font-bold px-1.5 tracking-wide"
              >
                Channel
              </Badge>
              <p className="text-sm font-medium text-muted-foreground">
                {chat.membersCount} subscribers
              </p>
            </div>
          </div>
        </div>

        {!isPreview && (
          <Tabs
            defaultValue="members"
            className="mt-8 flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-11 shrink-0 rounded-xl">
              <TabsTrigger
                value="members"
                className="gap-2 text-xs font-medium rounded-lg"
              >
                <Users className="w-3.5 h-3.5" /> Subscribers
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="gap-2 text-xs font-medium rounded-lg"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Media
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                disabled={!isSelfAdmin}
                className="gap-2 text-xs font-medium rounded-lg"
              >
                <Settings className="w-3.5 h-3.5" /> Settings
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 mt-4">
              <TabsContent
                value="members"
                className="h-full m-0 focus-visible:outline-none"
              >
                <ScrollArea className="h-full">
                  <div className="grid gap-1 pb-6 pr-4">
                    {sortedMembers.map((m) => {
                      const name =
                        m.user.displayName || m.user.firstName || "Unknown";
                      const role = m.role.toLowerCase();
                      return (
                        <ContextMenu key={m.user.id}>
                          <ContextMenuTrigger>
                            <div className="flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:bg-secondary/40 cursor-default">
                              <UserAvatar
                                src={m.user.photoUrl ?? null}
                                fallback={name}
                                size={40}
                                className="h-10 w-10 rounded-full shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium truncate block text-foreground">
                                  {name}
                                </span>
                              </div>
                              {role === "owner" && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-amber-500/20 text-amber-600 bg-amber-500/5 gap-1"
                                >
                                  <Crown className="w-2.5 h-2.5" /> Owner
                                </Badge>
                              )}
                              {role === "admin" && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-primary/20 text-primary bg-primary/5 gap-1"
                                >
                                  <Shield className="w-2.5 h-2.5" /> Admin
                                </Badge>
                              )}
                            </div>
                          </ContextMenuTrigger>
                          {isSelfAdmin && role !== "owner" && (
                            <ContextMenuContent className="w-52 rounded-xl shadow-xl border-muted/20">
                              <ContextMenuItem
                                className="gap-3 py-2.5"
                                onClick={() =>
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
                                onClick={() =>
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
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value="media"
                className="h-full m-0 focus-visible:outline-none"
              >
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 border-2 border-dashed border-muted/20 rounded-[32px]">
                  <Megaphone className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-semibold">No shared media</p>
                </div>
              </TabsContent>

              {isSelfAdmin && (
                <TabsContent
                  value="settings"
                  className="h-full m-0 focus-visible:outline-none"
                >
                  <form
                    onSubmit={handleSubmit(onSaveSettings)}
                    className="h-full flex flex-col min-h-0"
                  >
                    <ScrollArea className="flex-1">
                      <div className="space-y-6 pb-6 pr-4">
                        <div className="space-y-4 px-1">
                          <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                              Channel Name
                            </Label>
                            <Input
                              {...register("title")}
                              className={`bg-secondary/30 border-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-xl h-11 transition-all ${errors.title ? "border-destructive/50" : ""}`}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                              Channel Type
                            </Label>
                            <RadioGroup
                              value={visibility}
                              onValueChange={(v) =>
                                setValue(
                                  "visibility",
                                  v as "public" | "private",
                                  { shouldDirty: true },
                                )
                              }
                              className="grid grid-cols-2 gap-3"
                            >
                              <Label
                                className={`flex flex-col gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${visibility === "public" ? "border-primary bg-primary/5" : "border-secondary/50 bg-secondary/10 opacity-60"}`}
                              >
                                <RadioGroupItem
                                  value="public"
                                  className="sr-only"
                                />
                                <div className="flex items-center gap-2">
                                  <Globe
                                    className={`w-4 h-4 ${visibility === "public" ? "text-primary" : ""}`}
                                  />
                                  <span className="text-sm font-bold">
                                    Public
                                  </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground leading-tight">
                                  Anyone can search and join
                                </span>
                              </Label>
                              <Label
                                className={`flex flex-col gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${visibility === "private" ? "border-primary bg-primary/5" : "border-secondary/50 bg-secondary/10 opacity-60"}`}
                              >
                                <RadioGroupItem
                                  value="private"
                                  className="sr-only"
                                />
                                <div className="flex items-center gap-2">
                                  <Lock
                                    className={`w-4 h-4 ${visibility === "private" ? "text-primary" : ""}`}
                                  />
                                  <span className="text-sm font-bold">
                                    Private
                                  </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground leading-tight">
                                  Only via invite link
                                </span>
                              </Label>
                            </RadioGroup>
                          </div>

                          {visibility === "public" && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                              <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                Public Link
                              </Label>
                              <div className="flex items-center rounded-xl bg-secondary/30 border border-transparent focus-within:ring-1 focus-within:ring-primary h-11 overflow-hidden transition-all">
                                <span className="flex items-center justify-center w-10 h-full bg-secondary/20 text-muted-foreground text-sm font-bold border-r border-background/5">
                                  @
                                </span>
                                <input
                                  {...register("slug")}
                                  className="flex-1 bg-transparent px-3 text-sm outline-none w-full h-full"
                                  placeholder="link"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <Separator className="bg-muted/50" />
                        <div className="px-1">
                          <Button
                            variant="ghost"
                            type="button"
                            onClick={handleDeleteChannel}
                            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/5 font-medium px-4 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" /> Delete Channel
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                    <div className="pt-4 mt-auto">
                      <Button
                        disabled={!isDirty || isSubmitting}
                        type="submit"
                        className="w-full h-11 gap-2 shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-[0.98]"
                      >
                        <Save className="w-4 h-4" /> Save Changes
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              )}
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}
