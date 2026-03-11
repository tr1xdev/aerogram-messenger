import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { useApolloClient } from "@apollo/client/react";
import { Loader2, Search, MoreVertical, X } from "lucide-react";
import { HiDownload } from "react-icons/hi";
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
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const foldersRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const client = useApolloClient();
  const navigate = useNavigate();
  const pathname: string = useRouterState().location.pathname;
  const isWsConnected: boolean = useConnectionStore((s) => s.isWsConnected);

  const { data: userData } = useMe();
  const { data: chatsData, loading: isLoadingChats } = useMyChats();
  const { data: globalSearchData, loading: isSearchingGlobal } =
    useSearchUsers(debouncedQuery);
  const { createChat } = useChatActions("");

  const user: User | undefined = useMemo(() => userData?.me, [userData]);
  const chats: Chat[] = useMemo(
    () => chatsData?.myChats ?? [],
    [chatsData?.myChats],
  );

  const folders: ChatFolder[] = useMemo(() => {
    const totalUnread: number = chats.reduce(
      (acc: number, chat: Chat) => acc + (chat.unreadCount || 0),
      0,
    );
    return [{ id: "all", label: "All chats", unread: totalUnread }];
  }, [chats]);

  const filteredLocalChats: Chat[] = useMemo(() => {
    if (!debouncedQuery) return [];
    const q: string = debouncedQuery.toLowerCase();
    return chats.filter((c: Chat) => c.title.toLowerCase().includes(q));
  }, [debouncedQuery, chats]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const el: HTMLDivElement | null = scrollRef.current;
    if (el && !isLoadingChats && chats.length > 0 && !searchQuery) {
      el.scrollTop = 52;
    }
  }, [isLoadingChats, chats.length, searchQuery]);

  const updateIndicator = useCallback(() => {
    const container: HTMLDivElement | null = foldersRef.current;
    if (!container) return;
    const active: HTMLButtonElement | null = container.querySelector(
      `[data-folder-id="${activeFolder}"]`,
    );
    const label: HTMLSpanElement | null =
      active?.querySelector(".folder-label") || null;
    if (active && label) {
      setIndicatorStyle({
        left: active.offsetLeft + label.offsetLeft,
        width: label.offsetWidth,
      });
    }
  }, [activeFolder]);

  useEffect(() => {
    updateIndicator();
    const observer: ResizeObserver = new ResizeObserver(updateIndicator);
    if (foldersRef.current) observer.observe(foldersRef.current);
    return () => observer.disconnect();
  }, [updateIndicator, chats]);

  const handleSelectUser = async (userId: string): Promise<void> => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const newChat: Chat | undefined = await createChat(userId);
      if (newChat) {
        const existing: MyChatsData | null = client.readQuery<MyChatsData>({
          query: GET_MY_CHATS,
        });
        if (existing) {
          client.writeQuery<MyChatsData>({
            query: GET_MY_CHATS,
            data: {
              myChats: [
                newChat,
                ...existing.myChats.filter((c: Chat) => c.id !== newChat.id),
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
        className="w-full border-none bg-background flex flex-col h-[100dvh] overflow-hidden select-none gap-0"
      >
        <SidebarHeader className="px-4 pt-3 pb-4 shrink-0 z-50 bg-background border-none">
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

        <SidebarContent className="flex-1 min-h-0 relative bg-background">
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto scrollbar-none touch-pan-y overscroll-contain"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex flex-col min-h-[calc(100%+52px)]">
              <div className="px-4 pt-0 pb-2 shrink-0 bg-background h-[48px] flex items-end">
                <div className="flex items-center gap-2 w-full">
                  <div className="relative flex-1 flex items-center h-10">
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSearchQuery(e.target.value)
                      }
                      className="w-full h-full pl-4 pr-10 rounded-xl text-[14px] bg-muted/60 border-none outline-none transition-all"
                    />
                    <div
                      className={cn(
                        "absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-200 gap-2.5",
                        isFocused || searchQuery
                          ? "opacity-0 scale-95"
                          : "opacity-100",
                      )}
                    >
                      <Search className="h-4 w-4 text-muted-foreground/40" />
                      <span className="text-[14px] text-muted-foreground/70 font-medium">
                        Search
                      </span>
                    </div>
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setDebouncedQuery("");
                          inputRef.current?.focus();
                        }}
                        className="absolute right-3 p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {(searchQuery || isFocused) && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setDebouncedQuery("");
                        setIsFocused(false);
                        inputRef.current?.blur();
                      }}
                      className="flex items-center justify-center h-10 w-10 shrink-0 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground transition-all animate-in fade-in slide-in-from-right-2"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="sticky top-0 z-40 bg-background px-4 border-b border-border/5 shrink-0">
                <div className="relative flex items-center h-11">
                  <div
                    ref={foldersRef}
                    className="flex items-center overflow-x-auto scrollbar-none w-full h-full touch-pan-x"
                  >
                    <button className="shrink-0 pr-3 py-2 text-muted-foreground/30 hover:text-foreground transition-colors">
                      <HiDownload className="h-5 w-5" />
                    </button>
                    {folders.map((f: ChatFolder) => (
                      <button
                        key={f.id}
                        data-folder-id={f.id}
                        onClick={() => setActiveFolder(f.id)}
                        className={cn(
                          "shrink-0 px-4 h-9 flex items-center text-[13.5px] font-semibold transition-all relative",
                          f.id === activeFolder
                            ? "text-sky-500"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <span className="folder-label">{f.label}</span>
                          {f.unread > 0 && (
                            <span className="h-4 px-1 min-w-[16px] flex items-center justify-center text-[10px] rounded-full bg-blue-500/90 text-white font-bold">
                              {f.unread}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                    <div
                      className="absolute bottom-0 h-[2.5px] bg-sky-500 rounded-t-xl transition-all duration-300"
                      style={{
                        left: indicatorStyle.left,
                        width: indicatorStyle.width,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-background">
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
                    onSelectChat={(id: string) => {
                      setSearchQuery("");
                      navigate({ to: "/chat/$chatId", params: { chatId: id } });
                    }}
                    onSelectUser={handleSelectUser}
                  />
                ) : (
                  <SidebarGroup className="p-0">
                    <SidebarGroupContent>
                      <SidebarMenu className="gap-0">
                        {isLoadingChats && !chatsData
                          ? Array(10)
                              .fill(0)
                              .map((_: number, i: number) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-3 px-4 py-3.5"
                                >
                                  <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                                  <div className="flex-1 space-y-2">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-3 w-full opacity-40" />
                                  </div>
                                </div>
                              ))
                          : chats.map((chat: Chat) => (
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
                )}
              </div>
              <div className="h-[max(80px,env(safe-area-inset-bottom))] w-full shrink-0 bg-background" />
            </div>
          </div>
        </SidebarContent>

        <SidebarFooter
          className="hidden md:flex p-4 border-t border-border/5 bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer shrink-0"
          onClick={() => setSettingsOpen(true)}
        >
          {user ? (
            <div className="flex items-center gap-3 w-full">
              <Avatar className="h-9 w-9 border border-border/10 shrink-0">
                <AvatarFallback className="font-bold text-[11px] bg-primary/10 text-primary uppercase">
                  {user.first_name?.[0] || user.username?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13.5px] font-bold truncate leading-tight">
                  {user.first_name} {user.last_name}
                </span>
                <span className="text-[11px] text-muted-foreground/60 font-medium">
                  Settings
                </span>
              </div>
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
