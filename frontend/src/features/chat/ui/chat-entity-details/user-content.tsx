import { type ReactNode } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  if (!user) return null;

  const initials: string = (
    user.displayName?.[0] ??
    user.firstName?.[0] ??
    "?"
  ).toUpperCase();

  const fullName =
    user.displayName || `${user.firstName} ${user.lastName || ""}`.trim();
  const isOnline = user.status === "online";

  return (
    <div className="flex flex-col h-full bg-background select-none">
      <div className="relative h-32 bg-gradient-to-br from-primary/10 via-accent/5 to-background">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.4))]" />
      </div>

      <div className="px-8 pb-8 -mt-12 relative z-10 flex-1 flex flex-col min-h-0">
        <div className="relative inline-block w-fit">
          <Avatar className="h-28 w-28 border-[6px] border-background shadow-2xl rounded-[32px]">
            <AvatarImage src={user.photoUrl ?? ""} className="object-cover" />
            <AvatarFallback className="text-3xl font-bold bg-secondary text-secondary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-1 right-1 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-primary border-4 border-background"></span>
            </span>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-3xl font-bold tracking-tight text-foreground/90">
            {fullName}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge
              variant="secondary"
              className="rounded-md font-bold text-[10px] uppercase tracking-wider px-2 py-0.5"
            >
              User
            </Badge>
            <span
              className={`text-sm font-medium ${isOnline ? "text-primary" : "text-muted-foreground"}`}
            >
              {user.status || "offline"}
            </span>
          </div>
        </div>

        {!isPreview && (
          <ScrollArea className="mt-8 flex-1 min-h-0">
            <div className="space-y-6 pb-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/30 border border-secondary/50">
                <div className="p-2.5 rounded-xl bg-background shadow-sm text-primary">
                  <AtSign className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Username
                  </p>
                  <p className="text-sm font-semibold">@{user.username}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/30 border border-secondary/50">
                <div className="p-2.5 rounded-xl bg-background shadow-sm text-primary">
                  <Info className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    About
                  </p>
                  <p className="text-sm leading-relaxed font-medium text-foreground/80 whitespace-pre-wrap">
                    {user.bio || "No information provided"}
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
