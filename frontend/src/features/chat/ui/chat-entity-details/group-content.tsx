import { type ReactNode, useState } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParticipantSelector } from "../new-chat-dialog/participant-selector";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
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
        permissions {
          canInviteUsers
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
  isPreview,
}: {
  id: string;
  isPreview?: boolean;
}): ReactNode {
  const data: groupContentQuery["response"] =
    useLazyLoadQuery<groupContentQuery>(GroupQuery, { id });
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false);
  const { inviteUsers } = useChatActions(id);

  const chat = data.chat;
  if (!chat || chat.__typename !== "Chat") return null;

  const handleInvite = (userIds: string[]): void => {
    inviteUsers(userIds);
    setIsInviteOpen(false);
  };

  const currentMemberIds: string[] = chat.members?.map((m) => m.user.id) ?? [];

  return (
    <div className="flex flex-col">
      <div className="h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/30" />
      <div className="px-6 pb-6">
        <div className="flex justify-between items-end mb-4">
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl -mt-12">
            <AvatarImage src={chat.photoUrl ?? ""} className="object-cover" />
            <AvatarFallback className="text-2xl font-bold">
              {(chat.title?.[0] ?? "?").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!isPreview && chat.permissions?.canInviteUsers && (
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full font-black text-[10px] uppercase h-8 px-4"
              onClick={(): void => setIsInviteOpen(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Invite
            </Button>
          )}
        </div>

        <h3 className="text-2xl font-black leading-none">{chat.title}</h3>
        <p className="text-sm text-muted-foreground font-medium mt-1">
          {chat.membersCount} members
        </p>

        {!isPreview && (
          <Tabs defaultValue="members" className="mt-6">
            <TabsList className="w-full grid grid-cols-2 bg-muted/50 p-1">
              <TabsTrigger
                value="members"
                className="text-[10px] font-black uppercase"
              >
                Members
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="text-[10px] font-black uppercase"
              >
                Media
              </TabsTrigger>
            </TabsList>
            <TabsContent value="members" className="mt-4">
              <ScrollArea className="h-[240px] pr-4">
                <div className="space-y-3">
                  {chat.members?.map((m, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 text-xs">
                        <AvatarImage src={m.user.photoUrl ?? ""} />
                        <AvatarFallback>
                          {(
                            m.user.displayName?.[0] ||
                            m.user.firstName?.[0] ||
                            "?"
                          ).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">
                          {m.user.displayName || m.user.firstName}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                          {m.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden border-none shadow-2xl bg-background">
          <VisuallyHidden>
            <DialogTitle>Invite Members</DialogTitle>
            <DialogDescription>
              Select participants to add to the group
            </DialogDescription>
          </VisuallyHidden>
          <div className="p-6 pb-0">
            <h2 className="text-xl font-black uppercase tracking-tighter">
              Invite Members
            </h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">
              Select users to add
            </p>
          </div>
          <div className="px-6 pb-2">
            <ParticipantSelector
              isMulti
              onSelect={handleInvite}
              excludeIds={currentMemberIds}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
