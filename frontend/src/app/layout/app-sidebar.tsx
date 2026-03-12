import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { useApolloClient } from "@apollo/client/react";
import { Loader2, Search, MoreVertical, Settings } from "lucide-react";
import { HiDownload } from "react-icons/hi";
import { IoChatbubbles } from "react-icons/io5";
import { BsFillPinFill } from "react-icons/bs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NewChatDialog } from "@/features/chat/ui/new-chat-dialog";
import { ChatMenuItem } from "@/features/chat/ui/chat-menu-item";
import { SettingsDialog } from "@/features/settings/ui/settings-dialog";
import { SearchResults } from "@/features/chat/ui/search-results";
import {
  useMyChats,
  useMe,
  useSearchUsers,
  useChatActions,
} from "@/features/chat/lib/use-messages";
import { GET_MY_CHATS } from "@/features/chat/api/chat.gql";
import { useConnectionStore } from "@/store/connection";
import { cn } from "@/lib/utils";
import type { Chat, User } from "@/entities/chat/model/types";

interface ChatFolder {
  id: string;
  label: string;
  unread: number;
}

interface MyChatsData {
  myChats: Chat[];
}

export function AppSidebar() {
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const foldersRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const client = useApolloClient();
  const navigate = useNavigate();
  const pathname = useRouterState().location.pathname;
  const isWsConnected = useConnectionStore((s) => s.isWsConnected);

  const { data: userData } = useMe();
  const { data: chatsData, loading: isLoadingChats } = useMyChats();
  const { data: globalSearchData, loading: isSearchingGlobal } =
    useSearchUsers(debouncedQuery);
  const { createChat } = useChatActions("");

  const user = useMemo(() => userData?.me as User | undefined, [userData]);
  const chats = useMemo(() => chatsData?.myChats ?? [], [chatsData]);

  const pinnedChats = useMemo(() => chats.filter((c) => c.isPinned), [chats]);
  const otherChats = useMemo(() => chats.filter((c) => !c.isPinned), [chats]);

  const folders: ChatFolder[] = useMemo(() => {
    const totalUnread = chats.reduce(
      (acc, chat) => acc + (chat.unreadCount || 0),
      0,
    );
    return [{ id: "all", label: "All chats", unread: totalUnread }];
  }, [chats]);

  const filteredLocalChats = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    return chats.filter((c) => c.title.toLowerCase().includes(q));
  }, [debouncedQuery, chats]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const updateIndicator = useCallback(() => {
    const container = foldersRef.current;
    if (!container) return;
    const active = container.querySelector(
      `[data-folder-id="${activeFolder}"]`,
    ) as HTMLButtonElement;
    const label = active?.querySelector(".folder-label") as HTMLSpanElement;
    if (active && label) {
      setIndicatorStyle({
        left: active.offsetLeft + label.offsetLeft,
        width: label.offsetWidth,
      });
    }
  }, [activeFolder]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator, chats]);

  const handleSelectUser = async (userId: string) => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const newChat = await createChat(userId);
      if (newChat) {
        const existing = client.readQuery<MyChatsData>({ query: GET_MY_CHATS });
        if (existing) {
          client.writeQuery<MyChatsData>({
            query: GET_MY_CHATS,
            data: {
              myChats: [
                newChat,
                ...existing.myChats.filter((c) => c.id !== newChat.id),
              ],
            },
          });
        }
        setSearchQuery("");
        navigate({ to: "/chat/$chatId", params: { chatId: newChat.id } });
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Sidebar
        collapsible="none"
        className="w-full border-none bg-background flex flex-col h-screen overflow-hidden"
      >
        <SidebarHeader className="px-4 pt-3 pb-4 shrink-0 bg-background border-none">
          <div className="flex items-center justify-between h-8 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              {!isWsConnected ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-[13px] font-bold text-muted-foreground">
                    Connecting
                  </span>
                </div>
              ) : (
                <h1 className="text-[16px] font-bold tracking-tight">Chats</h1>
              )}
            </div>
            <div className="flex-1 flex justify-end items-center gap-1 z-10">
              <NewChatDialog />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full hover:bg-muted/80 transition-colors outline-none">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-xl shadow-xl"
                >
                  <DropdownMenuItem className="py-2.5">
                    New group
                  </DropdownMenuItem>
                  <DropdownMenuItem className="py-2.5">
                    Saved messages
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="py-2.5"
                    onClick={() => setSettingsOpen(true)}
                  >
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="flex flex-col min-h-full">
            <div className="px-4 py-2 sticky top-0 bg-background z-20">
              <div className="relative flex items-center h-10">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full pl-4 pr-10 rounded-xl text-[14px] bg-muted/60 border-none outline-none"
                />
                {!searchQuery && !isFocused && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none gap-2">
                    <Search className="h-4 w-4 text-muted-foreground/40" />
                    <span className="text-[14px] text-muted-foreground/70">
                      Search
                    </span>
                  </div>
                )}
              </div>
            </div>

            {chats.length > 0 && (
              <div className="sticky top-[56px] bg-background px-4 border-b border-border/5 z-20">
                <div
                  className="relative flex items-center h-11"
                  ref={foldersRef}
                >
                  <button className="shrink-0 pr-3 py-2 text-muted-foreground/30 hover:text-foreground">
                    <HiDownload className="h-5 w-5" />
                  </button>
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      data-folder-id={f.id}
                      onClick={() => setActiveFolder(f.id)}
                      className={cn(
                        "px-4 h-9 flex items-center text-[13.5px] font-semibold transition-all relative",
                        f.id === activeFolder
                          ? "text-sky-500"
                          : "text-muted-foreground",
                      )}
                    >
                      <span className="folder-label">{f.label}</span>
                    </button>
                  ))}
                  <div
                    className="absolute bottom-0 h-[2.5px] bg-sky-500 transition-all duration-300 rounded-t-full"
                    style={{
                      left: indicatorStyle.left,
                      width: indicatorStyle.width,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1">
              {searchQuery ? (
                <SearchResults
                  query={debouncedQuery}
                  localChats={filteredLocalChats}
                  globalUsers={globalSearchData?.searchUsers || []}
                  isLoading={
                    searchQuery !== debouncedQuery ||
                    isSearchingGlobal ||
                    isCreating
                  }
                  onSelectChat={(id) => {
                    setSearchQuery("");
                    navigate({ to: "/chat/$chatId", params: { chatId: id } });
                  }}
                  onSelectUser={handleSelectUser}
                />
              ) : isLoadingChats && chats.length === 0 ? (
                <div className="p-4 space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <IoChatbubbles className="h-12 w-12 mb-2" />
                  <p>No chats found</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {pinnedChats.length > 0 && (
                    <div className="flex flex-col">
                      <div className="px-4 pt-4 pb-2 text-[11px] font-bold text-muted-foreground/50 flex items-center gap-2">
                        <BsFillPinFill className="h-3 w-3" /> PINNED CHATS
                      </div>
                      <SidebarMenu>
                        {pinnedChats.map((chat) => (
                          <ChatMenuItem
                            key={chat.id}
                            chat={chat}
                            isActive={pathname.includes(chat.id)}
                            myId={user?.id}
                          />
                        ))}
                      </SidebarMenu>
                    </div>
                  )}

                  {otherChats.length > 0 && (
                    <div className="flex flex-col">
                      <div className="px-4 pt-4 pb-2 text-[11px] font-bold text-muted-foreground/50">
                        ALL CHATS
                      </div>
                      <SidebarMenu>
                        {otherChats.map((chat) => (
                          <ChatMenuItem
                            key={chat.id}
                            chat={chat}
                            isActive={pathname.includes(chat.id)}
                            myId={user?.id}
                          />
                        ))}
                      </SidebarMenu>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </SidebarContent>

        <SidebarFooter
          className="p-4 border-t border-border/5 bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer"
          onClick={() => setSettingsOpen(true)}
        >
          {user ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 border border-border/10">
                  <AvatarFallback className="font-bold text-[11px] bg-primary/10 text-primary uppercase">
                    {user.first_name?.[0] || user.username?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13.5px] font-bold truncate text-foreground leading-tight">
                    {user.first_name} {user.last_name}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Settings
                  </span>
                </div>
              </div>
              <Settings className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
          ) : (
            <Skeleton className="h-9 w-full rounded-xl" />
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
