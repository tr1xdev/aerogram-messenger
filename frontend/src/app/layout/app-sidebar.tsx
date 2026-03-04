import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NewChatDialog } from "@/features/chat/ui/new-chat-dialog";
import { ChatMenuItem } from "@/features/chat/ui/chat-menu-item";
import { SettingsDialog } from "@/features/settings/ui/settings-dialog";
import { useMyChats, useMe } from "@/features/chat/lib/use-messages";
import { useConnectionStore } from "@/store/connection";
import type { Chat } from "@/entities/chat/model/types";

export function AppSidebar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { data: userData } = useMe();
  const { data: chatsData, loading: isLoading } = useMyChats();
  const pathname = useRouterState().location.pathname;
  const isWsConnected = useConnectionStore((s) => s.isWsConnected);

  const user = userData?.me;
  const chats: Chat[] = chatsData?.myChats ?? [];

  return (
    <>
      <Sidebar
        collapsible="none"
        className="w-full border-none bg-background shadow-none"
      >
        <SidebarHeader className="px-4 pt-5 pb-2">
          <div className="flex items-center justify-between h-8 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {!isWsConnected ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-[14px] font-bold text-muted-foreground">
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
                  ? Array(8)
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-4 py-4"
                        >
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-full opacity-50" />
                          </div>
                        </div>
                      ))
                  : chats.map((chat) => (
                      <ChatMenuItem
                        key={chat.id}
                        chat={chat}
                        isActive={pathname.includes(chat.id)}
                        myId={user?.id}
                      />
                    ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter
          onClick={() => setSettingsOpen(true)}
          className="p-4 border-t border-border/40 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer"
        >
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-border/50">
                <AvatarFallback className="font-bold text-xs bg-primary/10 text-primary">
                  {(user.first_name || user.username || "?")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate">
                  {user.first_name || user.username}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Settings & Profile
                </span>
              </div>
            </div>
          ) : (
            <Skeleton className="h-9 w-full rounded-lg" />
          )}
        </SidebarFooter>
      </Sidebar>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={user}
      />
    </>
  );
}
