import { type ReactNode, useCallback, useRef } from "react";
import {
  LogOut,
  ChevronDown,
  Camera,
  Loader2,
  Bot,
  Terminal,
} from "lucide-react";
import { MdVerified } from "react-icons/md";
import { graphql, useMutation, useFragment } from "react-relay";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuthStore } from "@/store/auth-store";
import type { profileContent_user$key } from "./__generated__/profileContent_user.graphql";
import type { profileContentLogoutMutation } from "./__generated__/profileContentLogoutMutation.graphql";
import type { profileContentUploadAvatarMutation } from "./__generated__/profileContentUploadAvatarMutation.graphql";

const userFragment = graphql`
  fragment profileContent_user on User {
    id
    firstName
    lastName
    username
    displayName
    photoUrl
    bio
    isBot
    isVerified
    botDescription
    botCommands
    createdAt
  }
`;

const logoutMutation = graphql`
  mutation profileContentLogoutMutation {
    logout
  }
`;

const uploadAvatarMutation = graphql`
  mutation profileContentUploadAvatarMutation($file: Upload!) {
    uploadAvatar(file: $file) {
      id
      photoUrl
    }
  }
`;

interface ProfileContentProps {
  user: profileContent_user$key;
  onActionComplete?: () => void;
}

export function ProfileContent({
  user: userRef,
  onActionComplete,
}: ProfileContentProps): ReactNode {
  const user = useFragment(userFragment, userRef);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoutAction = useAuthStore((state) => state.logout);

  const [commitLogout] =
    useMutation<profileContentLogoutMutation>(logoutMutation);
  const [commitUpload, isUploading] =
    useMutation<profileContentUploadAvatarMutation>(uploadAvatarMutation);

  const handleLogout = useCallback((): void => {
    onActionComplete?.();
    const navigateToSignIn = () => {
      logoutAction();
      window.location.href = "/sign-in";
    };
    commitLogout({
      variables: {},
      onCompleted: navigateToSignIn,
      onError: navigateToSignIn,
    });
  }, [commitLogout, logoutAction, onActionComplete]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File is too large (max 10MB)");
        return;
      }

      commitUpload({
        variables: { file },
        uploadables: { file },
        onCompleted: () => {
          if (fileInputRef.current) fileInputRef.current.value = "";
          toast.success("Avatar updated");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to upload avatar");
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
      });
    },
    [commitUpload],
  );

  const initial = (user.firstName || user.username || "?")[0].toUpperCase();

  return (
    <div className="space-y-6 py-6 outline-none">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0 group">
          <Avatar
            className={`h-20 w-20 border border-border shadow-sm rounded-full overflow-hidden transition-all duration-300 ${
              isUploading
                ? "opacity-50 scale-95"
                : "group-hover:ring-4 group-hover:ring-primary/10"
            }`}
          >
            <AvatarImage
              src={user.photoUrl || undefined}
              alt={user.displayName || "User avatar"}
              className="aspect-square h-full w-full object-cover"
            />
            <AvatarFallback className="text-2xl bg-primary/5 text-primary font-bold h-full w-full flex items-center justify-center">
              {initial}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={handleAvatarClick}
            disabled={isUploading}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg border-2 border-background transition-transform active:scale-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-bold text-lg leading-tight truncate">
              {user.firstName} {user.lastName}
            </h3>
            {user.isVerified && (
              <MdVerified
                className="text-[#2196f3] shrink-0 text-[20px]"
                title="Verified Account"
              />
            )}
            {user.isBot && (
              <div className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                <Bot className="h-2.5 w-2.5" />
                Bot
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-medium truncate">
            @{user.username}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
          {user.isBot ? "Bot Description" : "Bio"}
        </label>
        <div className="w-full p-3 rounded-xl border bg-muted/30 text-sm text-muted-foreground italic">
          {user.isBot
            ? user.botDescription || "No description provided for this bot..."
            : user.bio || "Add a few words about yourself..."}
        </div>
      </div>

      {user.isBot && user.botCommands && (
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1.5">
            <Terminal className="h-3 w-3" />
            Bot Commands
          </label>
          <div className="w-full p-3 rounded-xl border bg-muted/20 font-mono text-[12px] text-muted-foreground whitespace-pre-wrap">
            {user.botCommands}
          </div>
        </div>
      )}

      <div className="pt-4 border-t space-y-4">
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/60 hover:text-muted-foreground transition-colors uppercase tracking-widest group">
            <ChevronDown className="h-3 w-3 group-data-[state=open]:rotate-180 transition-transform" />
            Technical Details
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="p-3 rounded-lg bg-muted/50 border border-dashed flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  User ID
                </span>
                <code className="text-[11px] font-mono break-all leading-relaxed select-all">
                  {user.id}
                </code>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">
                  Created At
                </span>
                <span className="text-[11px] font-medium">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleString()
                    : "Unknown"}
                </span>
              </div>
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
