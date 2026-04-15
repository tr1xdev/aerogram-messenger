import { useRouter } from "@tanstack/react-router";
import { graphql, useFragment, useLazyLoadQuery } from "react-relay";
import { motion } from "framer-motion";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  MessageCircle,
  Ban,
  BellOff,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { MdVerified } from "react-icons/md";
import type { ReactNode } from "react";
import type { userProfileOverlay_user$key } from "./__generated__/userProfileOverlay_user.graphql";
import type { userProfileOverlayQuery } from "./__generated__/userProfileOverlayQuery.graphql";

const UserProfileFragment = graphql`
  fragment userProfileOverlay_user on User {
    id
    email
    firstName
    lastName
    displayName
    username
    photoUrl
    bio
    status
    isVerified
  }
`;

const UserProfileQuery = graphql`
  query userProfileOverlayQuery($id: ID!) {
    user(id: $id) {
      ...userProfileOverlay_user
    }
  }
`;

export function UserProfileOverlay({ userId }: { userId: string }): ReactNode {
  const router = useRouter();

  const data = useLazyLoadQuery<userProfileOverlayQuery>(
    UserProfileQuery,
    { id: userId },
    { fetchPolicy: "store-or-network" },
  );

  const user = useFragment<userProfileOverlay_user$key>(
    UserProfileFragment,
    data.user,
  );

  const handleBack = (): void => {
    router.history.back();
  };

  const handleCopy = (text: string | null | undefined, label: string): void => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const overlayTransition = {
    type: "tween",
    ease: [0.33, 1, 0.68, 1],
    duration: 0.22,
  } as const;

  if (!user) {
    return <ProfileSkeleton />;
  }

  const fullName: string =
    user.displayName || `${user.firstName} ${user.lastName}`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBack}
        className="fixed inset-0 bg-black/40 z-90 md:hidden"
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={overlayTransition}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.5 }}
        onDragEnd={(_: unknown, info: { offset: { x: number } }): void => {
          if (info.offset.x > 50) handleBack();
        }}
        className="fixed inset-y-0 right-0 z-100 w-full bg-background shadow-2xl md:hidden will-change-transform overflow-hidden"
      >
        <header className="flex items-center p-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="rounded-full -ml-2 shrink-0"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <span className="ml-3 font-bold text-lg truncate">Profile</span>
        </header>

        <div className="pb-10 px-4 space-y-5 overflow-y-auto h-[calc(100vh-64px)] scrollbar-none">
          <div className="flex flex-col items-center py-8">
            <UserAvatar
              src={user.photoUrl}
              fallback={fullName}
              size={128}
              className="border-4 border-background shadow-xl"
            />

            <div className="mt-4 text-center w-full px-4">
              <div className="flex items-center justify-center gap-1.5 overflow-hidden">
                <h2 className="text-2xl font-bold tracking-tight truncate">
                  {fullName}
                </h2>
                {user.isVerified && (
                  <MdVerified className="text-[#2196f3] shrink-0 text-[24px]" />
                )}
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    user.status === "online" ? "bg-green-500" : "bg-zinc-400",
                  )}
                />
                <p className="text-[14px] text-muted-foreground font-medium truncate">
                  {user.status || "offline"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-muted/5 overflow-hidden">
            <InfoItem label="Bio" value={user.bio ?? "None"} isBio />
            <InfoItem
              label="Username"
              value={user.username ? `@${user.username}` : "None"}
              onClick={(): void => handleCopy(user.username, "Username")}
            />
            <InfoItem
              label="Email"
              value={user.email ?? "No email"}
              onClick={(): void => handleCopy(user.email, "Email")}
            />
          </div>

          <div className="rounded-2xl border border-border/40 bg-muted/5 overflow-hidden">
            <ActionRow
              icon={MessageCircle}
              label="Send Message"
              onClick={handleBack}
              primary
            />
            <ActionRow icon={BellOff} label="Mute Notifications" />
          </div>

          <div className="rounded-2xl border border-border/40 bg-muted/5 overflow-hidden">
            <ActionRow icon={Ban} label="Block User" isWarning />
          </div>
        </div>
      </motion.div>
    </>
  );
}

function InfoItem({
  label,
  value,
  onClick,
  isBio,
}: {
  label: string;
  value: string;
  onClick?: () => void;
  isBio?: boolean;
}): ReactNode {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex flex-col w-full px-4 py-3 text-left transition-colors border-b border-border/40 last:border-0 outline-none",
        onClick && "hover:bg-accent/40 active:bg-accent/60",
      )}
    >
      <span className="text-[11px] font-bold text-primary uppercase tracking-wider shrink-0">
        {label}
      </span>
      <span
        className={cn(
          "text-[15px] text-foreground leading-snug mt-1 break-words",
          isBio && "italic opacity-80",
        )}
      >
        {value}
      </span>
    </button>
  );
}

function ActionRow({
  icon: Icon,
  label,
  onClick,
  isWarning,
  primary,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  isWarning?: boolean;
  primary?: boolean;
}): ReactNode {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full px-4 py-4 text-left transition-colors hover:bg-accent/40 border-b border-border/40 last:border-0"
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          primary ? "text-primary" : "text-muted-foreground",
          isWarning && "text-destructive",
        )}
      />
      <span
        className={cn(
          "ml-4 text-[15px] font-semibold truncate",
          isWarning ? "text-destructive" : "text-foreground",
          primary && "text-primary",
        )}
      >
        {label}
      </span>
    </button>
  );
}

function ProfileSkeleton(): ReactNode {
  return (
    <div className="px-4 space-y-6 animate-pulse pt-6">
      <div className="flex flex-col items-center">
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="h-6 w-48 mt-4" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
