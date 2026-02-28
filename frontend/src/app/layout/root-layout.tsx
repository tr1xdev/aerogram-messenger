import {
  Outlet,
  useNavigate,
  useRouterState,
  Link,
} from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { NewChatDialog } from "@/features/chat/ui/new-chat-dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { useMyChats } from "@/features/chat/lib/use-messages";
import type { Chat } from "@/entities/chat/model/types";

export default function RootLayout() {
  const navigate = useNavigate();
  const isAuth = useAuthStore((s) => s.isAuth);
  const pathname = useRouterState().location.pathname;
  const { data, loading: isLoading } = useMyChats();

  const chats = data?.myChats;

  if (!isAuth && !["/login", "/signup", "/otp"].includes(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 md:p-10">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Start by logging in or signing up</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button
              onClick={() => navigate({ to: "/login" })}
              className="w-full"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate({ to: "/signup" })}
              variant="outline"
              className="w-full"
            >
              Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" className="border-r">
        <SidebarHeader className="flex flex-col px-3 pt-3 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-tight">
              Messages
            </span>
            <NewChatDialog />
          </div>
          <div className="mt-3 h-px w-full bg-border" />
        </SidebarHeader>

        <SidebarContent className="overflow-y-auto">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 px-2 py-2">
                {isLoading ? (
                  Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <SidebarMenuItem key={i}>
                        <div className="flex items-center gap-3 rounded-md px-2 py-2">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </SidebarMenuItem>
                    ))
                ) : !chats || chats.length === 0 ? (
                  <SidebarMenuItem>
                    <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                      No chats yet
                    </div>
                  </SidebarMenuItem>
                ) : (
                  chats.map((chat: Chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === `/chat/${chat.id}`}
                        className="h-auto p-0"
                      >
                        <Link
                          to="/chat/$chatId"
                          params={{ chatId: chat.id }}
                          className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-muted transition"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {chat.title.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="truncate text-sm font-medium">
                                {chat.title}
                              </span>
                              {chat.lastMessage && (
                                <span className="ml-2 shrink-0 text-[11px] text-muted-foreground">
                                  {new Date(
                                    chat.lastMessage.sentAt,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="truncate text-xs text-muted-foreground">
                                {chat.lastMessage
                                  ? `${chat.lastMessage.sender.first_name}: ${chat.lastMessage.text}`
                                  : "No messages yet"}
                              </p>
                              {chat.unreadCount > 0 && (
                                <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                                  {chat.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="px-4 py-3">
          <div className="text-xs text-muted-foreground">Logged in as User</div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col h-screen">
        <header className="flex h-14 items-center gap-2 px-3">
          <SidebarTrigger className="md:hidden" />
        </header>
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
