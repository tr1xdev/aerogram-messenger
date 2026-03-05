import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@apollo/client/react";
import { motion } from "framer-motion";
import { GET_USER_BY_ID } from "@/features/chat/api/chat.gql";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { User } from "@/entities/chat/model/types";

export const Route = createFileRoute("/(protected)/_layout/user/$userId")({
  component: () => null,
});

export function UserProfileOverlay({ userId }: { userId: string }) {
  const router = useRouter();
  const { data, loading } = useQuery<{ getUser: User }>(GET_USER_BY_ID, {
    variables: { id: userId },
    fetchPolicy: "cache-and-network",
  });

  const user = data?.getUser;
  const handleBack = (): void => {
    router.history.back();
  };

  const handleCopy = (text: string | undefined, label: string): void => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBack}
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[90] md:hidden"
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.9 }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 80) handleBack();
        }}
        className="fixed inset-y-0 right-0 z-[100] w-full bg-background shadow-2xl md:hidden"
      >
        <header className="flex items-center p-4 sticky top-0 bg-background/90 backdrop-blur-md z-10 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="rounded-full -ml-2"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <span className="ml-3 font-bold text-lg">Profile</span>
        </header>

        {loading || !user ? (
          <ProfileSkeleton />
        ) : (
          <div className="pb-10 px-4 space-y-5 overflow-y-auto h-[calc(100vh-64px)] scrollbar-none">
            <div className="flex flex-col items-center py-8">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage
                  src={user.photoUrl || ""}
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl bg-primary/10 text-primary font-bold uppercase">
                  {user.first_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="mt-4 text-center">
                <h2 className="text-2xl font-bold tracking-tight">
                  {user.first_name} {user.last_name}
                </h2>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      user.status === "online" ? "bg-green-500" : "bg-zinc-400",
                    )}
                  />
                  <p className="text-[14px] text-muted-foreground font-medium">
                    {user.status === "online" ? "online" : "offline"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/40 bg-muted/5 overflow-hidden">
              <InfoItem label="Bio" value={user.bio || "None"} isBio />
              <InfoItem
                label="Username"
                value={`@${user.username}`}
                onClick={() => handleCopy(user.username, "Username")}
              />
              <InfoItem
                label="Email"
                value={user.email}
                onClick={() => handleCopy(user.email, "Email")}
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
        )}
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
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex flex-col w-full px-4 py-3 text-left transition-colors border-b border-border/40 last:border-0 outline-none",
        onClick && "hover:bg-accent/40 active:bg-accent/60",
      )}
    >
      <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
        {label}
      </span>
      <span
        className={cn(
          "text-[15px] text-foreground leading-snug mt-1",
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
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full px-4 py-4 text-left transition-colors hover:bg-accent/40 border-b border-border/40 last:border-0"
    >
      <Icon
        className={cn(
          "h-5 w-5",
          primary ? "text-primary" : "text-muted-foreground",
          isWarning && "text-destructive",
        )}
      />
      <span
        className={cn(
          "ml-4 text-[15px] font-semibold",
          isWarning ? "text-destructive" : "text-foreground",
          primary && "text-primary",
        )}
      >
        {label}
      </span>
    </button>
  );
}

function ProfileSkeleton() {
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
