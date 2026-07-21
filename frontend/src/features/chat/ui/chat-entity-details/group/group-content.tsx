import { type ReactNode, useState, useMemo } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import {
  Image as ImageIcon,
  Users,
  Settings as SettingsIcon,
  UserPlus,
  ChevronRight,
} from "lucide-react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DetailsHeader } from "../ui/details-header";
import { MediaEmptyState } from "../ui/media-empty-state";
import { GroupMembers } from "./group-members";
import { InviteMembersDialog } from "./invite-members-dialog";
import type { groupContentQuery } from "./__generated__/groupContentQuery.graphql";

const GroupQuery = graphql`
  query groupContentQuery($id: ID!) {
    me {
      id
    }
    chat(id: $id) {
      __typename
      ... on Chat {
        id
        title
        photoUrl
        membersCount
        myRole
        permissions {
          canEditMetadata
        }
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

export function GroupContent({
  id,
  open,
  onOpenChange,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): ReactNode {
  const data: groupContentQuery["response"] =
    useLazyLoadQuery<groupContentQuery>(GroupQuery, { id });
  const chat = data.chat;
  const [inviteOpen, setInviteOpen] = useState(false);

  const chatMembers = chat?.__typename === "Chat" ? chat.members : null;

  const existingMemberIdsSet = useMemo(() => {
    return new Set((chatMembers ?? []).map((m) => m.user.id));
  }, [chatMembers]);

  if (!chat || chat.__typename !== "Chat") return null;

  const canManage: boolean =
    chat.myRole.toUpperCase() === "OWNER" ||
    chat.myRole.toUpperCase() === "ADMIN" ||
    chat.permissions.canEditMetadata;

  const previewMembers = (chat.members ?? []).slice(0, 5);
  const remainingCount = Math.max(chat.membersCount - previewMembers.length, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-0 shadow-lg duration-200 sm:rounded-2xl overflow-hidden">
          <VisuallyHidden.Root>
            <DialogTitle>{chat.title}</DialogTitle>
            <DialogDescription>Group management and media</DialogDescription>
          </VisuallyHidden.Root>

          <div className="flex flex-col h-[85vh] md:h-150">
            <ScrollArea className="flex-1">
              <div className="flex flex-col">
                <DetailsHeader
                  title={chat.title}
                  photoUrl={chat.photoUrl ?? null}
                  subtext={`${chat.membersCount} members`}
                  badge="Group"
                />

                <div className="px-6 pb-6 mt-5"> {/** added mt-5 here */}
                  <Tabs defaultValue="members" className="w-full">
                    <TabsList className="mb-6 w-full justify-start gap-1 bg-muted/20 p-1 h-11">
                      <TabsTrigger
                        value="members"
                        className="flex-1 gap-2 text-xs font-bold"
                      >
                        <Users className="w-3.5 h-3.5" /> Members
                      </TabsTrigger>
                      <TabsTrigger
                        value="media"
                        className="flex-1 gap-2 text-xs font-bold"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Media
                      </TabsTrigger>
                      <TabsTrigger
                        value="settings"
                        disabled={!canManage}
                        className="flex-1 gap-2 text-xs font-bold"
                      >
                        <SettingsIcon className="w-3.5 h-3.5" /> Settings
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="members" className="mt-0 outline-none">
                      <GroupMembers
                        chatId={chat.id}
                        members={chat.members ?? []}
                        currentUserId={data.me?.id ?? ""}
                        myRole={chat.myRole}
                      />
                    </TabsContent>

                    <TabsContent value="media" className="mt-0 outline-none">
                      <MediaEmptyState
                        title="No shared media"
                        description="Photos and videos will appear here"
                      />
                    </TabsContent>

                    <TabsContent value="settings" className="mt-0 outline-none">
                      <div className="flex flex-col gap-6">
                        <div>
                          <h1 className="text-lg font-semibold tracking-tight">
                            Management
                          </h1>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Manage who's part of this group
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setInviteOpen(true)}
                          className="group relative flex items-center gap-4 rounded-2xl border bg-card p-4 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <UserPlus className="h-5 w-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none">
                              Invite members
                            </p>
                            <p className="text-sm text-muted-foreground mt-1.5">
                              Add people by username or name
                            </p>
                          </div>

                          {previewMembers.length > 0 && (
                            <div className="hidden sm:flex items-center shrink-0 -space-x-2 mr-1">
                              {previewMembers.map((m) => (
                                <Avatar
                                  key={m.user.id}
                                  className="h-7 w-7 border-2 border-card"
                                >
                                  <AvatarImage src={m.user.photoUrl ?? undefined} />
                                  <AvatarFallback className="text-[10px]">
                                    {m.user.firstName?.[0] ?? m.user.displayName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {remainingCount > 0 && (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium text-muted-foreground">
                                  +{remainingCount}
                                </div>
                              )}
                            </div>
                          )}

                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <InviteMembersDialog
        chatId={chat.id}
        existingMemberIdsSet={existingMemberIdsSet}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
    </>
  );
}
