import { type ReactNode, useMemo } from "react";
import { Shield, ShieldOff, UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { MemberItem } from "../ui/member-item";
import { SectionLabel } from "../ui/section-label";
import { useChannelActions } from "../hooks/use-channel-actions";
import type { groupContentQuery$data } from "./__generated__/groupContentQuery.graphql";

type GroupMember = NonNullable<
  Extract<
    groupContentQuery$data["chat"],
    { readonly __typename: "Chat" }
  >["members"]
>[number];

interface Props {
  chatId: string;
  members: readonly GroupMember[];
  currentUserId: string;
  myRole: string;
}

export function GroupMembers({
  chatId,
  members,
  currentUserId,
  myRole,
}: Props): ReactNode {
  const { toggleAdmin, kickMember } = useChannelActions(chatId);

  const currentUserRole: string = myRole.toLowerCase();
  const isSelfManager: boolean =
    currentUserRole === "owner" || currentUserRole === "admin";

  const sortedMembers: readonly GroupMember[] =
    useMemo((): readonly GroupMember[] => {
      return [...members].sort((a: GroupMember, b: GroupMember): number => {
        const roles: Record<string, number> = { owner: 0, admin: 1, member: 2 };
        const roleA: number = roles[a.role.toLowerCase()] ?? 3;
        const roleB: number = roles[b.role.toLowerCase()] ?? 3;

        if (roleA !== roleB) return roleA - roleB;

        const nameA: string = a.user.displayName || a.user.firstName || "";
        const nameB: string = b.user.displayName || b.user.firstName || "";
        return nameA.localeCompare(nameB);
      });
    }, [members]);

  return (
    <div className="space-y-4">
      <SectionLabel>Group Members ({members.length})</SectionLabel>
      <div className="space-y-0.5">
        {sortedMembers.map((m: GroupMember): ReactNode => {
          const displayName: string =
            m.user.displayName || m.user.firstName || "User";
          const targetRole: string = m.role.toLowerCase();
          const isMe: boolean = m.user.id === currentUserId;

          const canManage: boolean =
            isSelfManager && !isMe && targetRole !== "owner";

          const renderRoleBadge = (): ReactNode => {
            if (targetRole === "member") return null;
            return (
              <Badge
                variant="secondary"
                className="text-[9px] uppercase px-1.5 h-4 font-bold pointer-events-none"
              >
                {targetRole === "owner" ? "Creator" : targetRole}
              </Badge>
            );
          };

          return (
            <ContextMenu key={m.user.id}>
              <ContextMenuTrigger disabled={!canManage}>
                <div className="group block rounded-md transition-all duration-200 hover:bg-secondary/60 active:bg-secondary px-2 -mx-2 cursor-default">
                  <MemberItem
                    displayName={displayName}
                    photoUrl={m.user.photoUrl ?? null}
                    isMe={isMe}
                    subtitle={
                      targetRole === "owner"
                        ? "Group Creator"
                        : targetRole === "admin"
                          ? "Administrator"
                          : "Member"
                    }
                    badge={renderRoleBadge()}
                  />
                </div>
              </ContextMenuTrigger>

              {canManage && (
                <ContextMenuContent className="w-52">
                  <ContextMenuItem
                    onClick={(): void =>
                      toggleAdmin(m.user.id, m.role, displayName)
                    }
                    className="gap-2"
                  >
                    {targetRole === "admin" ? (
                      <>
                        <ShieldOff className="h-4 w-4 text-muted-foreground" />
                        <span>Dismiss admin</span>
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>Make admin</span>
                      </>
                    )}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive gap-2"
                    onClick={(): void => kickMember(m.user.id, displayName)}
                  >
                    <UserMinus className="h-4 w-4" />
                    <span>Remove from group</span>
                  </ContextMenuItem>
                </ContextMenuContent>
              )}
            </ContextMenu>
          );
        })}
      </div>
    </div>
  );
}
