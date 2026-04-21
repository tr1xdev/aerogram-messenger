import { type ReactNode } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  const data: userContentQuery["response"] = useLazyLoadQuery<userContentQuery>(
    UserQuery,
    { id: userId },
  );
  const user = data.user;

  if (!user) return null;

  const initials: string = (
    user.displayName?.[0] ??
    user.firstName?.[0] ??
    "?"
  ).toUpperCase();

  return (
    <div className="flex flex-col">
      <div className="h-24 bg-gradient-to-br from-primary/20 to-accent/30" />
      <div className="px-6 pb-6">
        <Avatar className="h-24 w-24 border-4 border-background shadow-xl -mt-12 mb-4">
          <AvatarImage src={user.photoUrl ?? ""} className="object-cover" />
          <AvatarFallback className="text-2xl font-bold uppercase">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h3 className="text-2xl font-black leading-none">
            {user.displayName || `${user.firstName} ${user.lastName}`}
          </h3>
          <p className="text-muted-foreground font-medium">@{user.username}</p>
        </div>
        {!isPreview && (
          <div className="mt-6 pt-6 border-t border-border/50 space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-primary tracking-widest">
                Bio
              </p>
              <p className="text-sm leading-relaxed text-foreground/80">
                {user.bio || "No bio yet"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase text-primary tracking-widest">
                Status
              </p>
              <Badge
                variant={user.status === "online" ? "default" : "secondary"}
                className="uppercase text-[9px] font-black"
              >
                {user.status}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
