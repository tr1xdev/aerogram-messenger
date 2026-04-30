import { type ReactNode, useMemo } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AtSign, Info } from "lucide-react";
import type { userContentQuery } from "./__generated__/userContentQuery.graphql";

const UserQuery = graphql`
  query userContentQuery($id: ID!) {
    user(id: $id) {
      id
      username
      displayName
      firstName
      lastName
      photoUrl
      bio
      status
      isBot
      botDescription
    }
  }
`;

export function UserContent({
  userId,
  isPreview,
}: {
  userId: string;
  isPreview?: boolean;
}): ReactNode {
  const data = useLazyLoadQuery<userContentQuery>(UserQuery, { id: userId });
  const user = data.user;

  const initials: string = useMemo((): string => {
    if (!user) return "??";

    const fName: string = user.firstName ?? "";
    const lName: string = user.lastName ?? "";

    if (fName && lName) {
      return `${fName[0]}${lName[0]}`.toUpperCase();
    }

    const fallbackName: string =
      user.displayName || fName || user.username || "?";
    return fallbackName.slice(0, 2).toUpperCase();
  }, [user]);

  if (!user) {
    return null;
  }

  const fullName: string =
    (user.displayName ||
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
      user.username) ??
    "";

  const isOnline: boolean = user.status === "online";
  const description: string =
    (user.isBot ? user.botDescription : user.bio) ?? "";

  return (
    <div className="flex flex-col h-full bg-background select-none">
      <div className="relative h-40 bg-gradient-to-br from-primary/5 via-transparent to-background shrink-0">
        <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
      </div>

      <div className="px-8 pb-8 -mt-20 relative z-10 flex-1 flex flex-col min-h-0">
        <div className="relative inline-block w-fit group">
          <UserAvatar
            src={user.photoUrl ?? null}
            fallback={initials}
            userId={user.id}
            size={128}
            className="h-32 w-32 border-[6px] border-background shadow-2xl rounded-[40px] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {isOnline && (
            <span className="absolute bottom-2 right-2 flex h-6 w-6 rounded-full bg-primary border-[4px] border-background shadow-sm" />
          )}
        </div>

        <div className="mt-6 space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-3xl font-black tracking-tight text-foreground/90">
              {fullName}
            </h3>
            {user.isBot && (
              <Badge
                variant="secondary"
                className="h-5 rounded-md font-black text-[9px] uppercase tracking-wider px-1.5 bg-primary/10 text-primary border-none shadow-none"
              >
                Bot
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-muted-foreground/60">
            <span className="text-[13px] font-medium flex items-center gap-1">
              <AtSign className="w-3.5 h-3.5 opacity-50" />
              {user.username ?? ""}
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span
              className={`text-[12px] font-bold uppercase tracking-tight ${isOnline ? "text-primary" : ""}`}
            >
              {user.isBot ? user.status || "active" : user.status || "offline"}
            </span>
          </div>
        </div>

        {!isPreview && (
          <div className="flex-1 min-h-0 mt-10">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 pb-6">
                <div className="relative p-6 rounded-[32px] bg-secondary/10 border border-secondary/20 transition-colors duration-300 hover:bg-secondary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl bg-background shadow-sm text-primary/70">
                      <Info className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                      Information
                    </p>
                  </div>
                  <p className="text-[15px] leading-relaxed font-medium text-foreground/80 whitespace-pre-wrap break-words">
                    {description || "No information provided yet."}
                  </p>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
