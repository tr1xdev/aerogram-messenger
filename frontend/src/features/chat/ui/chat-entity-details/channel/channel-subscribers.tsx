import { type ReactNode, useMemo } from "react";
import { Shield, ShieldOff, UserMinus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { MemberItem } from "../ui/member-item";
import { useChannelActions } from "../hooks/use-channel-actions";

interface Member {
  readonly user: {
    readonly id: string;
    readonly displayName?: string | null;
    readonly firstName: string;
    readonly photoUrl?: string | null;
  };
  readonly role: string;
}

interface Props {
  chatId: string;
  members: readonly Member[];
  myRole: string;
  currentUserId?: string;
}

export function ChannelSubscribers({
  chatId,
  members,
  myRole,
  currentUserId,
}: Props): ReactNode {
  const { toggleAdmin, kickMember } = useChannelActions(chatId);

  const currentUserRole: string = myRole.toLowerCase();
  const isSelfAdmin: boolean =
    currentUserRole === "owner" || currentUserRole === "admin";

  const sortedMembers: readonly Member[] = useMemo((): readonly Member[] => {
    return [...members].sort((a: Member, b: Member): number => {
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
    <ScrollArea className="h-full">
      <div className="grid gap-0.5 pb-6 pr-4">
        {sortedMembers.map((m: Member): ReactNode => {
          const displayName: string = m.user.displayName || m.user.firstName;
          const targetRole: string = m.role.toLowerCase();
          const isOwner: boolean = targetRole === "owner";
          const isAdmin: boolean = targetRole === "admin";
          const isMe: boolean = m.user.id === currentUserId;

          const canManage: boolean = isSelfAdmin && !isMe && !isOwner;

          const renderRoleBadge = (): ReactNode => {
            if (targetRole === "member") return null;
            return (
              <Badge
                variant="secondary"
                className="text-[9px] uppercase px-1.5 h-4 font-bold pointer-events-none"
              >
                {isOwner ? "Creator" : targetRole}
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
                      isOwner
                        ? "Channel Creator"
                        : isAdmin
                          ? "Administrator"
                          : "Subscriber"
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
                    {isAdmin ? (
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
                    <span>Remove from channel</span>
                  </ContextMenuItem>
                </ContextMenuContent>
              )}
            </ContextMenu>
          );
        })}
      </div>
    </ScrollArea>
  );
}
