import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Loader2, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { NewChatDialog } from "@/features/chat/ui/new-chat-dialog";
import { useMyChats, useMe } from "@/features/chat/lib/use-messages";
import { useConnectionStore } from "@/store/connection";
import { useAuthStore } from "@/store/auth";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";

import { ChatMenuItem } from "./chat-menu-item";
import { SessionsManager } from "./sessions-manager";
import type { Chat } from "@/entities/chat/model/types";

const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export function AppSidebar() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: userData } = useMe();
  const { data: chatsData, loading: isLoading } = useMyChats();
  const pathname = useRouterState().location.pathname;
  const isWsConnected = useConnectionStore((state) => state.isWsConnected);
  const chats: Chat[] = chatsData?.myChats ?? [];
  const [logoutMutation] = useMutation(LOGOUT);
  const setAuth = useAuthStore((s) => s.setAuth);

  const getUserInitial = (): string => {
    const name: string =
      userData?.me.first_name || userData?.me.username || "?";
    return name[0].toUpperCase();
  };

  const user = userData?.me;

  const handleLogout = async () => {
    try {
      await logoutMutation();

      localStorage.clear();
      sessionStorage.clear();

      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      setAuth(false);
      window.location.href = "/auth/login";
    } catch (error: unknown) {
      console.error("Logout failed", error);
      localStorage.clear();
      window.location.href = "/auth/login";
    }
  };

  return (
    <>
      <Sidebar collapsible="none" className="w-full border-none bg-background">
        <SidebarHeader className="px-4 pt-5 pb-2">
          <div className="flex items-center justify-between h-8 relative">
            <div className="flex-1" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center whitespace-nowrap">
              {!isWsConnected ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-[15px] font-medium text-foreground/70">
                    Connecting
                  </span>
                </div>
              ) : (
                <h1 className="text-[17px] font-bold tracking-tight text-foreground">
                  Chats
                </h1>
              )}
            </div>
            <div className="flex-1 flex justify-end z-10">
              <NewChatDialog />
            </div>
          </div>
          <div className="mt-4 h-px w-full bg-border/40" />
        </SidebarHeader>

        <SidebarContent className="scrollbar-none">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                {isLoading && !chatsData
                  ? Array(12)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-center">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-10" />
                            </div>
                            <Skeleton className="h-3 w-full opacity-60" />
                          </div>
                        </div>
                      ))
                  : chats.map((chat) => (
                      <ChatMenuItem
                        key={chat.id}
                        chat={chat}
                        isActive={pathname.includes(chat.id)}
                        myId={userData?.me.id}
                      />
                    ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter
          onClick={() => setDialogOpen(true)}
          className="hidden md:flex p-4 border-t bg-muted/5 hover:bg-muted/20 transition-colors cursor-pointer"
        >
          {!user ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 w-12" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <Avatar className="h-9 w-9 border border-border/50">
                <AvatarFallback className="font-bold text-xs bg-primary/10 text-primary">
                  {getUserInitial()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold truncate leading-none mb-1">
                  {user.first_name || user.username || "User"}
                </span>
                <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                  Lorem ipsum dolor sit amet...
                </p>
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Profile & Settings</DialogTitle>
            <DialogDescription>
              Manage your account, view sessions, and more.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="profile" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-border">
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {getUserInitial()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {user?.first_name} {user?.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    @{user?.username}
                  </p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    Status: {user?.status || "offline"}
                  </p>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Bio</h4>
                <p className="text-sm text-muted-foreground">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore.
                </p>
              </div>
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Account actions</h4>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout from all devices
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="sessions" className="py-4">
              <SessionsManager userId={user?.id} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
