import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useFragment, graphql } from "react-relay";
import { AppearanceSettings } from "./appearance-settings";
import { SessionsManager } from "./sessions-manager";
import { ProfileContent } from "./profile-content";
import type { settingsDialog_user$key } from "./__generated__/settingsDialog_user.graphql";

const settingsDialogFragment = graphql`
  fragment settingsDialog_user on User {
    id
    ...profileContent_user
  }
`;

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: settingsDialog_user$key | null;
}

export function SettingsDialog({
  open,
  onOpenChange,
  user: userRef,
}: SettingsDialogProps) {
  const user = useFragment(settingsDialogFragment, userRef ?? null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] gap-0 p-0 overflow-hidden border-border/40 shadow-2xl bg-background">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold tracking-tight">
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <div className="px-6 border-b">
            <TabsList className="bg-transparent h-10 w-full justify-start gap-8 p-0">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 text-[13px] font-bold text-muted-foreground data-[state=active]:text-foreground transition-all"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 text-[13px] font-bold text-muted-foreground data-[state=active]:text-foreground transition-all"
              >
                Appearance
              </TabsTrigger>
              <TabsTrigger
                value="sessions"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 text-[13px] font-bold text-muted-foreground data-[state=active]:text-foreground transition-all"
              >
                Sessions
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-6 h-[440px] overflow-y-auto scrollbar-none">
            <TabsContent value="profile" className="m-0 outline-none">
              {user ? (
                <ProfileContent
                  user={user}
                  onActionComplete={() => onOpenChange(false)}
                />
              ) : (
                <div className="space-y-6 py-6">
                  <div className="flex items-center gap-5">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                  <div className="pt-4 border-t space-y-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="appearance" className="m-0 outline-none">
              <AppearanceSettings />
            </TabsContent>

            <TabsContent value="sessions" className="m-0 outline-none">
              {user ? (
                <SessionsManager userId={user.id} />
              ) : (
                <div className="space-y-4 py-6">
                  <Skeleton className="h-8 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
