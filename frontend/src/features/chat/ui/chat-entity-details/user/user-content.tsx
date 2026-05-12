import { type ReactNode, Suspense, memo, useEffect, useState } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import {
  Image as ImageIcon,
  User as UserIcon,
  MessageSquare,
  BellOff,
  ShieldAlert,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailsHeader } from "../ui/details-header";
import type { userContentQuery } from "./__generated__/userContentQuery.graphql";

const UserQuery = graphql`
  query userContentQuery($id: ID!) {
    user(id: $id) {
      id
      firstName
      lastName
      displayName
      username
      photoUrl
      status
      bio
    }
  }
`;

function UserContentSkeleton(): ReactNode {
  return (
    <div className="flex flex-col w-full h-full bg-background">
      <div className="h-48 w-full bg-muted/5 relative">
        <div className="absolute -bottom-12 left-6">
          <Skeleton className="h-28 w-28 rounded-[32px] border-[4px] border-background" />
        </div>
      </div>
      <div className="px-6 pt-16 pb-4 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

const UserDataContent = memo(({ id }: { id: string }): ReactNode => {
  const [isReady, setIsReady] = useState(false);
  const data = useLazyLoadQuery<userContentQuery>(
    UserQuery,
    { id },
    { fetchPolicy: "store-or-network" },
  );

  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  const user = data.user;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-muted-foreground text-sm font-medium">
          User not found
        </span>
      </div>
    );
  }

  const fullName =
    user.displayName ||
    `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`;

  return (
    <div className="flex flex-col w-full h-full bg-background select-none overflow-hidden animate-in fade-in duration-300">
      <ScrollArea className="flex-1 w-full h-full">
        <div className="flex flex-col will-change-transform">
          <DetailsHeader
            title={fullName}
            photoUrl={user.photoUrl ?? null}
            slug={user.username}
            subtext={user.status || "Private Chat"}
            badge="User"
          />

          <div className="px-6 pb-6 flex flex-col">
            {user.bio && (
              <div className="mb-6 px-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">
                  Bio
                </h4>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {user.bio}
                </p>
              </div>
            )}

            <div className="flex gap-2 mb-8 mt-2">
              <Button
                className="flex-1 gap-2 h-10 text-xs font-bold rounded-xl"
                variant="secondary"
              >
                <MessageSquare className="w-3.5 h-3.5 text-primary" /> Message
              </Button>
              <Button
                className="flex-1 gap-2 h-10 text-xs font-bold rounded-xl"
                variant="secondary"
              >
                <UserIcon className="w-3.5 h-3.5 text-primary" /> Profile
              </Button>
            </div>

            {isReady && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-1 mb-2">
                    Media, Links and Docs
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="aspect-square bg-muted/10 rounded-xl flex items-center justify-center border border-muted/5 hover:bg-muted/20 transition-all cursor-pointer"
                      >
                        <ImageIcon className="w-4 h-4 text-muted-foreground/10" />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-muted/20" />

                <div className="space-y-1 pb-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 px-1 mb-2">
                    Settings & Privacy
                  </h4>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11 text-sm font-bold px-2 rounded-xl"
                  >
                    <BellOff className="w-4 h-4 text-muted-foreground/60" />
                    Mute Notifications
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-11 text-sm font-bold px-2 rounded-xl text-destructive hover:bg-destructive/5"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Block User
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
});

UserDataContent.displayName = "UserDataContent";

export function UserContent({ id }: { id: string }): ReactNode {
  return (
    <Suspense fallback={<UserContentSkeleton />}>
      <UserDataContent id={id} />
    </Suspense>
  );
}
