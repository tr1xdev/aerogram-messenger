import { type ReactNode, useState, useMemo } from "react";
import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import {
  Plus,
  Shield,
  UserMinus,
  Image as ImageIcon,
  Users,
} from "lucide-react";
import type { RecordSourceSelectorProxy, RecordProxy } from "relay-runtime";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ParticipantSelector } from "../new-chat-dialog/participant-selector";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useChatActions } from "../../lib/chat/use-chat-management";
import type { groupContentQuery } from "./__generated__/groupContentQuery.graphql";

const GroupQuery = graphql`
  query groupContentQuery($id: ID!) {
    chat(id: $id) {
      __typename
      ... on Chat {
        id
        title
        photoUrl
        membersCount
        myRole
        permissions {
          canInviteUsers
          canAssignAdmins
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

const UpdateRoleMutation = graphql`
  mutation groupContentUpdateRoleMutation(
    $chatID: ID!
    $userID: ID!
    $role: String!
  ) {
    updateMemberRole(chatID: $chatID, userID: $userID, role: $role) {
      ... on SuccessResult {
        success
      }
    }
  }
`;

const RemoveMemberMutation = graphql`
  mutation groupContentRemoveMemberMutation($chatID: ID!, $userID: ID!) {
    removeChatMember(chatID: $chatID, userID: $userID) {
      ... on SuccessResult {
        success
      }
    }
  }
`;

export function GroupContent({
  id,
  isPreview,
}: {
  id: string;
  isPreview?: boolean;
}): ReactNode {
  const data = useLazyLoadQuery<groupContentQuery>(GroupQuery, { id });
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false);
  const { inviteUsers } = useChatActions(id);
  const [commitUpdateRole] = useMutation(UpdateRoleMutation);
  const [commitRemove] = useMutation(RemoveMemberMutation);

  const chat = data.chat;

  const sortedMembers = useMemo(() => {
    if (!chat || chat.__typename !== "Chat" || !chat.members) return [];

    const getWeight = (role: string): number => {
      if (role === "owner") return 3;
      if (role === "admin") return 2;
      return 1;
    };

    return [...chat.members].sort(
      (a, b): number => getWeight(b.role) - getWeight(a.role),
    );
  }, [chat]);

  if (!chat || chat.__typename !== "Chat") return null;

  const isSelfAdmin: boolean =
    chat.myRole === "owner" || chat.myRole === "admin";

  const handleUpdateRole = (userID: string, currentRole: string): void => {
    const newRole: string = currentRole === "admin" ? "member" : "admin";

    commitUpdateRole({
      variables: { chatID: id, userID, role: newRole },
      optimisticResponse: {
        updateMemberRole: {
          __typename: "SuccessResult",
          success: true,
        },
      },
      updater: (store: RecordSourceSelectorProxy): void => {
        const chatRecord: RecordProxy | null = store.get(id) ?? null;
        if (!chatRecord) return;
        const members: readonly RecordProxy[] | null =
          chatRecord.getLinkedRecords("members") ?? null;
        if (!members) return;

        members.forEach((member: RecordProxy): void => {
          const user: RecordProxy | null =
            member.getLinkedRecord("user") ?? null;
          if (user && user.getDataID() === userID) {
            member.setValue(newRole, "role");
          }
        });
      },
    });
  };

  const handleRemoveMember = (userID: string): void => {
    commitRemove({
      variables: { chatID: id, userID },
      optimisticResponse: {
        removeChatMember: {
          __typename: "SuccessResult",
          success: true,
        },
      },
      updater: (store: RecordSourceSelectorProxy): void => {
        const chatRecord: RecordProxy | null = store.get(id) ?? null;
        if (!chatRecord) return;

        const members: readonly RecordProxy[] | null =
          chatRecord.getLinkedRecords("members") ?? null;
        if (members) {
          const nextMembers: RecordProxy[] = members.filter(
            (m: RecordProxy): boolean =>
              (m.getLinkedRecord("user") ?? null)?.getDataID() !== userID,
          );
          chatRecord.setLinkedRecords(nextMembers, "members");

          const currentCount = chatRecord.getValue("membersCount");
          if (typeof currentCount === "number") {
            chatRecord.setValue(Math.max(0, currentCount - 1), "membersCount");
          }
        }
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-background select-none">
      <div className="relative h-32 bg-gradient-to-b from-primary/10 to-background">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
      </div>

      <div className="px-8 pb-8 -mt-12 relative z-10 flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-end">
          <UserAvatar
            src={chat.photoUrl ?? null}
            fallback={chat.title}
            size={112}
            className="h-28 w-28 border-[6px] border-background shadow-2xl rounded-[32px] object-cover"
          />

          {!isPreview && chat.permissions?.canInviteUsers && (
            <Button
              onClick={(): void => setIsInviteOpen(true)}
              className="rounded-2xl font-bold px-6 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 mr-2 stroke-[3]" />
              Add Member
            </Button>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-3xl font-bold tracking-tight text-foreground/90">
            {chat.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge
              variant="secondary"
              className="rounded-md font-bold text-[10px] uppercase tracking-wider px-2 py-0.5"
            >
              Group
            </Badge>
            <span className="text-sm font-medium text-muted-foreground">
              {chat.membersCount} participants
            </span>
          </div>
        </div>

        {!isPreview && (
          <Tabs
            defaultValue="members"
            className="mt-10 flex-1 flex flex-col min-h-0"
          >
            <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-8 shrink-0">
              <TabsTrigger
                value="members"
                className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 pb-3 bg-transparent font-bold text-sm transition-none"
              >
                <Users className="w-4 h-4 mr-2" />
                Members
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none px-1 pb-3 bg-transparent font-bold text-sm transition-none"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Media
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 mt-6">
              <TabsContent
                value="members"
                className="h-full m-0 focus-visible:outline-none"
              >
                <ScrollArea className="h-full">
                  <div className="grid gap-1 pr-4">
                    {sortedMembers.map(
                      (m): ReactNode => (
                        <ContextMenu key={m.user.id}>
                          <ContextMenuTrigger>
                            <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-secondary/50 transition-all cursor-pointer group active:bg-secondary/80">
                              <UserAvatar
                                src={m.user.photoUrl ?? null}
                                fallback={
                                  m.user.firstName || m.user.displayName || "?"
                                }
                                userId={m.user.id}
                                size={44}
                                className="h-11 w-11 rounded-2xl shadow-sm"
                              />

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-foreground/90 truncate mr-2">
                                    {m.user.displayName || m.user.firstName}
                                  </span>
                                  {m.role !== "member" && (
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                                      {m.role}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-tighter mt-0.5">
                                  {m.role === "member" ? "Participant" : m.role}
                                </p>
                              </div>
                            </div>
                          </ContextMenuTrigger>

                          {isSelfAdmin && m.role !== "owner" && (
                            <ContextMenuContent className="w-64 rounded-xl p-1.5 shadow-xl border-muted/40">
                              <ContextMenuItem
                                className="rounded-lg font-semibold text-sm py-2 px-3 gap-3"
                                onClick={(): void =>
                                  handleUpdateRole(m.user.id, m.role)
                                }
                              >
                                <Shield className="w-4 h-4 text-muted-foreground" />
                                {m.role === "admin"
                                  ? "Dismiss as Admin"
                                  : "Make Group Admin"}
                              </ContextMenuItem>

                              <ContextMenuSeparator className="my-1" />

                              <ContextMenuItem
                                className="rounded-lg font-semibold text-sm py-2 px-3 gap-3 text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={(): void =>
                                  handleRemoveMember(m.user.id)
                                }
                              >
                                <UserMinus className="w-4 h-4" />
                                Remove from Group
                              </ContextMenuItem>
                            </ContextMenuContent>
                          )}
                        </ContextMenu>
                      ),
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value="media"
                className="h-full m-0 focus-visible:outline-none"
              >
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 border-2 border-dashed border-muted/20 rounded-[32px]">
                  <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-medium">No media found</p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[32px] border-none shadow-2xl">
          <div className="p-8 pb-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Add Participants
            </h2>
          </div>
          <div className="px-8 pb-8">
            <ParticipantSelector
              isMulti
              onSelect={(uids: string[]): void => {
                inviteUsers(uids);
                setIsInviteOpen(false);
              }}
              excludeIds={chat.members?.map((m): string => m.user.id) ?? []}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
