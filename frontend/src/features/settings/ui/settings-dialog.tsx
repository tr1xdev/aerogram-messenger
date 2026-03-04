import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppearanceSettings } from "./appearance-settings";
import { SessionsManager } from "./sessions-manager";
import { ProfileContent } from "./profile-content";
import type { User } from "@/entities/chat/model/types";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}

export function SettingsDialog({
  open,
  onOpenChange,
  user,
}: SettingsDialogProps) {
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

          <div className="px-6 h-[400px] overflow-y-auto scrollbar-none">
            <TabsContent value="profile" className="m-0 outline-none">
              <ProfileContent
                user={user}
                onActionComplete={() => onOpenChange(false)}
              />
            </TabsContent>

            <TabsContent value="appearance" className="m-0 outline-none">
              <AppearanceSettings />
            </TabsContent>

            <TabsContent value="sessions" className="m-0 outline-none">
              <SessionsManager userId={user?.id} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
