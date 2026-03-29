import { LogOut, ChevronDown } from "lucide-react";
import { MdVerified } from "react-icons/md";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { logoutAll } from "@/app/api/apollo-client";
import type { User } from "@/entities/chat/model/types";

const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

interface ProfileContentProps {
  user?: User;
  onActionComplete?: () => void;
}

export function ProfileContent({
  user,
  onActionComplete,
}: ProfileContentProps) {
  const [logoutMutation] = useMutation(LOGOUT);

  const handleLogout = async (): Promise<void> => {
    try {
      await logoutMutation();
    } catch (e) {
      console.error(e);
    } finally {
      onActionComplete?.();
      await logoutAll();
    }
  };

  const initial = (user?.firstName || user?.username || "?")[0].toUpperCase();

  return (
    <div className="space-y-6 py-6 outline-none">
      <div className="flex items-center gap-5">
        <Avatar className="h-20 w-20 border border-border shadow-sm shrink-0 rounded-full overflow-hidden">
          <AvatarImage
            src={user?.photoUrl || undefined}
            alt={`${user?.firstName} ${user?.lastName}`}
            className="aspect-square h-full w-full object-cover"
          />
          <AvatarFallback className="text-2xl bg-primary/5 text-primary font-bold h-full w-full flex items-center justify-center uppercase">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-bold text-lg leading-tight truncate">
              {user?.firstName} {user?.lastName}
            </h3>
            {user?.isVerified && (
              <MdVerified
                className="text-[#2196f3] shrink-0 text-[20px]"
                title="Verified Account"
              />
            )}
          </div>
          <p className="text-sm text-muted-foreground font-medium truncate">
            @{user?.username}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
          Bio
        </label>
        <div className="w-full p-3 rounded-xl border bg-muted/30 text-sm text-muted-foreground italic">
          Add a few words about yourself...
        </div>
      </div>

      <div className="pt-4 border-t space-y-4">
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/60 hover:text-muted-foreground transition-colors uppercase tracking-widest group">
            <ChevronDown className="h-3 w-3 group-data-[state=open]:rotate-180 transition-transform" />
            Technical Details
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="p-3 rounded-lg bg-muted/50 border border-dashed flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">
                User ID
              </span>
              <code className="text-[11px] font-mono break-all leading-relaxed select-all">
                {user?.id}
              </code>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start h-12 px-4 text-destructive hover:text-destructive hover:bg-destructive/5 font-bold rounded-xl transition-all group"
        >
          <div className="p-1.5 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 mr-3 transition-colors">
            <LogOut className="h-4 w-4" />
          </div>
          Logout from account
        </Button>
      </div>
    </div>
  );
}
