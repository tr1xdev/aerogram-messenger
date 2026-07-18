import { type ReactNode, useState, useMemo } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import {
  Image as ImageIcon,
  Users,
  Settings as SettingsIcon,
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
import { DetailsHeader } from "../ui/details-header";
import { MediaEmptyState } from "../ui/media-empty-state";
import { GroupMembers } from "./group-members";
import { InviteMembersDialog } from "./invite-members-dialog";
import type { groupContentQuery } from "./__generated__/groupContentQuery.graphql";
import { Button } from "@/components/ui/button";

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

                <div className="px-6 pb-6">
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
                      <div className="flex flex-col gap-3">
                        <h1 className="text-lg">Management</h1>
                        <div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setInviteOpen(true)}
                          >
                            Invite members
                          </Button>
                        </div>
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
