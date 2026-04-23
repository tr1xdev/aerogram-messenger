import { type ReactNode } from "react";
import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import {
  Image as ImageIcon,
  Users,
  Megaphone,
  Shield,
  ShieldOff,
  Crown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { RecordSourceSelectorProxy } from "relay-runtime";
import type { channelContentQuery } from "./__generated__/channelContentQuery.graphql";

const ChannelQuery = graphql`
  query channelContentQuery($id: ID!) {
    chat(id: $id) {
      __typename
      ... on Chat {
        id
        title
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

const UpdateRoleMutation = graphql`
  mutation channelContentUpdateRoleMutation(
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

export function ChannelContent({
  id,
  isPreview,
}: {
  id: string;
  isPreview?: boolean;
}): ReactNode {
  const data = useLazyLoadQuery<channelContentQuery>(ChannelQuery, { id });
  const [commitUpdateRole] = useMutation(UpdateRoleMutation);

  const chat = data.chat;

  if (!chat || chat.__typename !== "Chat") {
    return null;
  }

  const chatId: string = chat.id;
  const myRole: string = chat.myRole;
  const isSelfAdmin: boolean = myRole === "owner" || myRole === "admin";

  const getRoleWeight = (role: string): number => {
    switch (role) {
      case "owner":
        return 3;
      case "admin":
        return 2;
      default:
        return 1;
    }
  };

  const sortedMembers = [...(chat.members ?? [])].sort(
    (a, b) => getRoleWeight(b.role) - getRoleWeight(a.role),
  );

  const applyRoleUpdate = (
    store: RecordSourceSelectorProxy,
    userID: string,
    newRole: string,
  ): void => {
    const chatRecord = store.get(chatId);
    if (!chatRecord) return;

    const members = chatRecord.getLinkedRecords("members");
    if (!members) return;

    members.forEach((memberProxy) => {
      const userProxy = memberProxy.getLinkedRecord("user");
      if (userProxy?.getDataID() === userID) {
        memberProxy.setValue(newRole, "role");
      }
    });
  };

  const handleToggleAdmin = (userID: string, currentRole: string): void => {
    const newRole: string = currentRole === "admin" ? "member" : "admin";

    commitUpdateRole({
      variables: { chatID: chatId, userID, role: newRole },
      optimisticResponse: {
        updateMemberRole: {
          __typename: "SuccessResult",
          success: true,
        },
      },
      optimisticUpdater: (store) => applyRoleUpdate(store, userID, newRole),
      updater: (store) => applyRoleUpdate(store, userID, newRole),
    });
  };

  return (
    <div className="flex flex-col h-full bg-background select-none">
      <div className="relative h-40 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent shrink-0">
        <div className="absolute inset-0 bg-grid-white/5 opacity-30" />
      </div>

      <div className="px-6 pb-6 -mt-16 relative z-10 flex-1 flex flex-col min-h-0">
        <div className="flex items-end gap-5">
          <Avatar className="h-32 w-32 border-[4px] border-background shadow-xl rounded-[40px] shrink-0">
            <AvatarImage src={chat.photoUrl ?? ""} className="object-cover" />
            <AvatarFallback className="text-4xl font-bold bg-muted text-muted-foreground">
              {chat.title?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="mb-2 min-w-0 flex-1">
            <h3 className="text-2xl font-bold tracking-tight text-foreground truncate">
              {chat.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
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
            <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-6 shrink-0">
              <TabsTrigger
                value="members"
                className="px-0 pb-3 bg-transparent font-bold text-sm data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none transition-none shadow-none"
              >
                <Users className="w-4 h-4 mr-2" />
                Subscribers
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="px-0 pb-3 bg-transparent font-bold text-sm data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none transition-none shadow-none text-muted-foreground"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Media
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="members"
              className="mt-4 flex-1 min-h-0 focus-visible:outline-none"
            >
              <ScrollArea className="h-full pr-2">
                <div className="grid gap-0.5 pb-6">
                  {sortedMembers.map((m) => {
                    const isOwner: boolean = m.role === "owner";
                    const isAdmin: boolean = m.role === "admin";
                    const isMe: boolean = m.role === myRole;

                    return (
                      <ContextMenu key={m.user.id}>
                        <ContextMenuTrigger>
                          <div className="flex items-center gap-4 p-2.5 rounded-xl transition-all duration-200 hover:bg-secondary/40 group cursor-default">
                            <Avatar className="h-10 w-10 rounded-xl shadow-sm shrink-0">
                              <AvatarImage src={m.user.photoUrl ?? ""} />
                              <AvatarFallback className="font-bold text-xs bg-secondary">
                                {m.user.firstName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[14px] font-semibold truncate text-foreground/90 leading-none">
                                    {m.user.displayName || m.user.firstName}
                                  </span>
                                  {isOwner && (
                                    <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />
                                  )}
                                  {isAdmin && !isOwner && (
                                    <Shield className="w-3 h-3 text-primary shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {isMe && (
                                    <Badge
                                      variant="default"
                                      className="h-4 px-1 text-[9px] uppercase font-bold tracking-tight"
                                    >
                                      You
                                    </Badge>
                                  )}
                                  <span
                                    className={`text-[10px] font-bold uppercase tracking-wider ${isOwner ? "text-yellow-600" : isAdmin ? "text-primary" : "text-muted-foreground/60"}`}
                                  >
                                    {m.role}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </ContextMenuTrigger>

                        {isSelfAdmin && !isOwner && (
                          <ContextMenuContent className="w-52 rounded-xl shadow-xl border-muted/40">
                            <ContextMenuItem
                              className="gap-3 font-semibold py-2.5 cursor-pointer"
                              onClick={() =>
                                handleToggleAdmin(m.user.id, m.role)
                              }
                            >
                              {isAdmin ? (
                                <>
                                  <ShieldOff className="w-4 h-4 text-muted-foreground" />
                                  Dismiss admin
                                </>
                              ) : (
                                <>
                                  <Shield className="w-4 h-4 text-primary" />
                                  Promote to admin
                                </>
                              )}
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
              className="mt-4 flex-1 min-h-0 focus-visible:outline-none"
            >
              <ScrollArea className="h-full">
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/40">
                  <Megaphone className="w-12 h-12 mb-3" />
                  <p className="text-sm font-semibold tracking-tight">
                    No media content yet
                  </p>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
