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

const ANIMATION_CONFIG = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  panel: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
    transition: { type: "tween", ease: [0.33, 1, 0.68, 1], duration: 0.25 },
  },
} as const;

interface UserProfileOverlayProps {
  userId: string;
}

export function UserProfileOverlay({
  userId,
}: UserProfileOverlayProps): ReactNode {
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

  if (!user) return <ProfileSkeleton />;

  const fullName =
    user.displayName || `${user.firstName} ${user.lastName}`.trim();

  return (
    <>
      <motion.div
        {...ANIMATION_CONFIG.overlay}
        onClick={handleBack}
        className="fixed inset-0 bg-black/60 z-[90] md:hidden backdrop-blur-[2px]"
      />

      <motion.div
        {...ANIMATION_CONFIG.panel}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.5 }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 80) handleBack();
        }}
        className="fixed inset-y-0 right-0 z-[100] w-full bg-background shadow-2xl md:hidden will-change-transform flex flex-col"
      >
        <header className="flex items-center h-16 px-4 shrink-0 bg-background/80 backdrop-blur-md border-b z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="rounded-full -ml-2 shrink-0 hover:bg-muted"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <span className="ml-3 font-bold text-lg">Profile</span>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-none pb-12">
          <div className="flex flex-col items-center py-10 px-6">
            <div className="relative group">
              <UserAvatar
                src={user.photoUrl}
                fallback={fullName}
                size={140}
                className="border-4 border-background shadow-2xl transition-transform group-active:scale-95"
              />
              <div
                className={cn(
                  "absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-background shadow-sm",
                  user.status === "online" ? "bg-green-500" : "bg-zinc-400",
                )}
              />
            </div>

            <div className="mt-6 text-center space-y-1 w-full">
              <div className="flex items-center justify-center gap-1.5">
                <h2 className="text-2xl font-heavy tracking-tight truncate max-w-[280px]">
                  {fullName}
                </h2>
                {user.isVerified && (
                  <MdVerified className="text-blue-500 shrink-0 text-2xl" />
                )}
              </div>
              <p
                className={cn(
                  "text-[14px] font-medium transition-colors",
                  user.status === "online"
                    ? "text-green-500"
                    : "text-muted-foreground",
                )}
              >
                {user.status || "offline"}
              </p>
            </div>
          </div>

          <div className="px-4 space-y-4">
            <section className="rounded-2xl border border-border/40 bg-muted/5 overflow-hidden">
              <InfoItem
                label="Bio"
                value={user.bio ?? "No bio provided"}
                isBio
              />
              <InfoItem
                label="Username"
                value={user.username ? `@${user.username}` : "Not set"}
                onClick={() => handleCopy(user.username, "Username")}
              />
              <InfoItem
                label="Email"
                value={user.email ?? "Private"}
                onClick={() => handleCopy(user.email, "Email")}
              />
            </section>

            <section className="rounded-2xl border border-border/40 bg-muted/5 overflow-hidden">
              <ActionRow
                icon={MessageCircle}
                label="Send Message"
                onClick={handleBack}
                primary
              />
              <ActionRow icon={BellOff} label="Mute Notifications" />
            </section>

            <section className="rounded-2xl border border-border/40 bg-muted/5 overflow-hidden">
              <ActionRow icon={Ban} label="Block User" isWarning />
            </section>
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
        "flex flex-col w-full px-5 py-4 text-left transition-all border-b border-border/40 last:border-0",
        onClick && "hover:bg-accent/50 active:bg-accent",
      )}
    >
      <span className="text-[10px] font-black text-primary/80 uppercase tracking-[0.1em]">
        {label}
      </span>
      <span
        className={cn(
          "text-[15px] font-medium leading-normal mt-1",
          isBio ? "text-foreground/70 italic" : "text-foreground",
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
      className="flex items-center w-full px-5 py-4 text-left transition-all hover:bg-accent/50 active:bg-accent border-b border-border/40 last:border-0"
    >
      <div
        className={cn(
          "p-2 rounded-lg shrink-0",
          primary ? "bg-primary/10" : "bg-muted/10",
          isWarning && "bg-destructive/10",
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            primary ? "text-primary" : "text-muted-foreground",
            isWarning && "text-destructive",
          )}
        />
      </div>
      <span
        className={cn(
          "ml-4 text-[15px] font-bold tracking-tight",
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
    <div className="fixed inset-0 z-[100] bg-background md:hidden">
      <div className="h-16 px-4 flex items-center border-b">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="px-6 py-10 flex flex-col items-center">
        <Skeleton className="h-[140px] w-[140px] rounded-full" />
        <Skeleton className="h-7 w-48 mt-6" />
        <Skeleton className="h-4 w-24 mt-2" />
      </div>
      <div className="px-4 space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    </div>
  );
}
