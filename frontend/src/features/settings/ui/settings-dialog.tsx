import { LogOut, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useAuthStore } from "@/store/auth";
import { AppearanceSettings } from "./appearance-settings";
import { SessionsManager } from "./sessions-manager";
import type { User } from "@/entities/chat/model/types";

const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

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
  const [logoutMutation] = useMutation(LOGOUT);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogout = async (): Promise<void> => {
    try {
      await logoutMutation();
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setAuth(false);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    }
  };

  const initial = (user?.first_name || user?.username || "?")[0].toUpperCase();

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
            <TabsContent value="profile" className="py-6 m-0 outline-none">
              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <Avatar className="h-20 w-20 border border-border shadow-sm">
                    <AvatarFallback className="text-2xl bg-primary/5 text-primary font-bold">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg leading-tight truncate">
                      {user?.first_name} {user?.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium truncate">
                      @{user?.username}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Bio
                  </label>
                  <div className="w-full p-3 rounded-xl border bg-muted/30 text-sm text-muted-foreground italic">
                    Add a few words about yourself...
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/60 hover:text-muted-foreground transition-colors uppercase tracking-widest group">
                      <ChevronDown className="h-3 w-3 group-data-[state=open]:rotate-180 transition-transform" />
                      Technical Details
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <div className="p-3 rounded-lg bg-muted/50 border border-dashed flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">
                          User ID
                        </span>
                        <code className="text-[11px] font-mono break-all">
                          {user?.id}
                        </code>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start h-11 px-4 text-destructive hover:text-destructive hover:bg-destructive/5 font-bold rounded-xl transition-all group"
                  >
                    <div className="p-1.5 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 mr-3 transition-colors">
                      <LogOut className="h-4 w-4" />
                    </div>
                    Logout from account
                  </Button>
                </div>
              </div>
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
