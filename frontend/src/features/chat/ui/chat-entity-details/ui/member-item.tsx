import { type ReactNode } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Shield, ShieldOff, UserMinus } from "lucide-react";

interface Props {
  displayName: string;
  photoUrl: string | null;
  role?: string;
  isMe?: boolean;
  subtitle?: string;
  badge?: ReactNode;
  onClick?: () => void;
  className?: string;
  canManage?: boolean;
  onToggleAdmin?: () => void;
  onKick?: () => void;
}

export function MemberItem({
  displayName,
  photoUrl,
  role,
  isMe,
  subtitle,
  badge,
  onClick,
  className,
  canManage,
  onToggleAdmin,
  onKick,
}: Props): ReactNode {
  const isAdmin: boolean = role?.toLowerCase() === "admin";

  const content: ReactNode = (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-default group",
        onClick && "cursor-pointer hover:bg-secondary/40",
        className,
      )}
    >
      <UserAvatar
        src={photoUrl}
        fallback={displayName}
        size={40}
        className="rounded-xl shadow-sm"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[14px] font-semibold truncate text-foreground/90 leading-none">
              {displayName}
            </span>
            {isMe && (
              <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                (You)
              </span>
            )}
          </div>
          {role && (
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider shrink-0",
                role.toLowerCase() === "owner"
                  ? "text-yellow-600"
                  : role.toLowerCase() === "admin"
                    ? "text-primary"
                    : "text-muted-foreground/60",
              )}
            >
              {role}
            </span>
          )}
        </div>
        <div className="text-[12px] text-muted-foreground truncate font-medium mt-0.5">
          {subtitle || (role && role.toLowerCase())}
        </div>
      </div>
      {badge}
    </div>
  );

  if (!canManage) return content;

  return (
    <ContextMenu>
      <ContextMenuTrigger>{content}</ContextMenuTrigger>
      <ContextMenuContent className="w-52 rounded-xl shadow-xl border-muted/40">
        <ContextMenuItem
          className="gap-3 font-semibold py-2.5 cursor-pointer"
          onClick={onToggleAdmin}
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
        <ContextMenuSeparator />
        <ContextMenuItem
          className="gap-3 font-semibold py-2.5 cursor-pointer text-destructive focus:text-destructive"
          onClick={onKick}
        >
          <UserMinus className="w-4 h-4" />
          Kick from channel
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
