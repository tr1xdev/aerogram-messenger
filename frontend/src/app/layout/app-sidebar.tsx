import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { useApolloClient } from "@apollo/client/react";
import {
  Loader2,
  Search,
  MoreVertical,
  Settings,
  History,
  X,
} from "lucide-react";
import { MdVerified } from "react-icons/md";
import { HiDownload } from "react-icons/hi";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { GET_MY_CHATS } from "@/features/chat/api";
import { useConnectionStore } from "@/store/connection";
import { cn } from "@/lib/utils";
import type { Chat, User } from "@/entities/chat/model/types";
import { Button } from "@/components/ui/button";

interface ApolloChat extends Chat {
  __typename: "Chat";
}

interface ApolloChatList {
  __typename: "ChatList";
  chats: ApolloChat[];
}

interface MyChatsData {
  myChats: ApolloChatList;
}

interface ChatFolder {
  id: string;
  label: string;
  unread: number;
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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const foldersRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const client = useApolloClient();
  const navigate = useNavigate();
  const pathname: string = useRouterState().location.pathname;
  const isWsConnected: boolean = useConnectionStore((s) => s.isWsConnected);

  const { data: userData, loading: isLoadingMe } = useMe();
  const { data: chatsData, loading: isLoadingChats } = useMyChats();
  const { data: globalSearchData, loading: isSearchingGlobal } =
    useSearchUsers(debouncedQuery);
  const { createChat } = useChatActions("");

  const user = useMemo(
    (): User | undefined => userData?.me as User | undefined,
    [userData],
  );

  const chats = useMemo((): ApolloChat[] => {
    const rawChats = chatsData?.myChats?.chats;
    if (Array.isArray(rawChats)) {
      return rawChats as ApolloChat[];
    }
    return [];
  }, [chatsData]);

  const fullName = useMemo((): string => {
    if (!user) return "";
    const first: string = user.firstName?.trim() || "";
    const last: string = user.lastName?.trim() || "";
    if (!first && !last) return user.username || "";
    return `${first} ${last}`.trim();
  }, [user]);

  const avatarFallback = useMemo((): string => {
    if (!user) return "?";
    return (user.firstName?.[0] || user.username?.[0] || "?").toUpperCase();
  }, [user]);

  const pinnedChats = useMemo(
    (): ApolloChat[] => chats.filter((c: ApolloChat) => c.isPinned),
    [chats],
  );
  const otherChats = useMemo(
    (): ApolloChat[] => chats.filter((c: ApolloChat) => !c.isPinned),
    [chats],
  );

  const folders: ChatFolder[] = useMemo((): ChatFolder[] => {
    const totalUnread: number = chats.reduce(
      (acc: number, chat: ApolloChat) => acc + (chat.unreadCount || 0),
      0,
    );
    return [{ id: "all", label: "All chats", unread: totalUnread }];
  }, [chats]);

  const filteredLocalChats = useMemo((): ApolloChat[] => {
    if (!debouncedQuery) return [];
    const q: string = debouncedQuery.toLowerCase();
    return chats.filter((c: ApolloChat) => c.title.toLowerCase().includes(q));
  }, [debouncedQuery, chats]);

  useEffect((): void => {
    const saved: string | null = localStorage.getItem("recent_searches");
    if (saved) setRecentSearches(JSON.parse(saved) as string[]);
  }, []);

  useEffect((): (() => void) => {
    const handler = setTimeout((): void => setDebouncedQuery(searchQuery), 250);
    return (): void => clearTimeout(handler);
  }, [searchQuery]);

  const updateIndicator = useCallback((): void => {
    const container: HTMLDivElement | null = foldersRef.current;
    if (!container) return;
    const active: HTMLButtonElement | null = container.querySelector(
      `[data-folder-id="${activeFolder}"]`,
    ) as HTMLButtonElement;
    const label: HTMLSpanElement | null = active?.querySelector(
      ".folder-label",
    ) as HTMLSpanElement;
    if (active && label) {
      setIndicatorStyle({
        left: active.offsetLeft + label.offsetLeft,
        width: label.offsetWidth,
      });
    }
  }, [activeFolder]);

  useEffect((): (() => void) => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return (): void => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator, chats]);

  const addToRecent = useCallback((query: string): void => {
    const trimmed: string = query.trim();
    if (!trimmed) return;
    setRecentSearches((prev: string[]) => {
      const updated: string[] = [
        trimmed,
        ...prev.filter((s: string) => s !== trimmed),
      ].slice(0, 10);
      localStorage.setItem("recent_searches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromRecent = (e: React.MouseEvent, query: string): void => {
    e.stopPropagation();
    const updated: string[] = recentSearches.filter((s: string) => s !== query);
    setRecentSearches(updated);
    localStorage.setItem("recent_searches", JSON.stringify(updated));
  };

  const handleClearAll = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem("recent_searches");
  };

  const handleSelectUser = async (userId: string): Promise<void> => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const newChat: Chat | undefined = await createChat(userId);
      if (newChat) {
        const existing = client.readQuery<MyChatsData>({
          query: GET_MY_CHATS,
        });

        if (existing?.myChats) {
          const apolloNewChat: ApolloChat = {
            ...newChat,
            __typename: "Chat",
          };

          client.writeQuery<MyChatsData>({
            query: GET_MY_CHATS,
            data: {
              myChats: {
                __typename: "ChatList",
                chats: [
                  apolloNewChat,
                  ...existing.myChats.chats.filter(
                    (c: ApolloChat) => c.id !== newChat.id,
                  ),
                ],
              },
            },
          });
        }

        if (searchQuery) addToRecent(searchQuery);
        setSearchQuery("");
        setIsFocused(false);
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
        <SidebarHeader className="px-4 pt-3 shrink-0 bg-background border-none">
          <div className="flex items-center justify-between h-8 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              {!isWsConnected ? (
                <div className="flex items-center gap-1.5 animate-in fade-in duration-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-[13px] font-bold text-muted-foreground">
                    Connecting
                  </span>
                </div>
              ) : (
                <h1 className="text-[16px] font-bold tracking-tight animate-in fade-in duration-300">
                  Chats
                </h1>
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
                    onClick={(): void => setSettingsOpen(true)}
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
              <div className="flex items-center gap-2 h-10">
                <div className="relative flex-1 h-full">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onFocus={(): void => setIsFocused(true)}
                    onBlur={(): void => {
                      if (!searchQuery) setIsFocused(false);
                    }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                      setSearchQuery(e.target.value)
                    }
                    onKeyDown={(
                      e: React.KeyboardEvent<HTMLInputElement>,
                    ): void => {
                      if (e.key === "Enter" && searchQuery) {
                        addToRecent(searchQuery);
                        inputRef.current?.blur();
                      }
                    }}
                    className="w-full h-full pl-4 pr-10 rounded-xl text-[14px] bg-muted/60 border-none outline-none focus-visible:ring-0 transition-all text-foreground"
                  />
                  {!searchQuery && !isFocused && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none gap-2">
                      <Search className="h-4 w-4 text-muted-foreground/60" />
                      <span className="text-[14px] text-muted-foreground/90 font-medium">
                        Search messages or users
                      </span>
                    </div>
                  )}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={(e: React.MouseEvent): void => {
                        e.preventDefault();
                        setSearchQuery("");
                        inputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
                {(searchQuery || isFocused) && (
                  <button
                    type="button"
                    onClick={(): void => {
                      setSearchQuery("");
                      setIsFocused(false);
                      inputRef.current?.blur();
                    }}
                    className="flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-muted/60 hover:bg-muted/80 text-foreground transition-all active:scale-95 animate-in fade-in zoom-in duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {chats.length > 0 && !searchQuery && !isFocused && (
              <div className="sticky top-14 bg-background px-4 border-b border-border/50 z-20">
                <div
                  className="relative flex items-center h-11"
                  ref={foldersRef}
                >
                  <button className="shrink-0 pr-3 py-2 text-muted-foreground/30 hover:text-foreground">
                    <HiDownload className="h-5 w-5" />
                  </button>
                  {folders.map((f: ChatFolder) => (
                    <button
                      key={f.id}
                      data-folder-id={f.id}
                      onClick={(): void => setActiveFolder(f.id)}
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
              {searchQuery || isFocused ? (
                <div className="flex flex-col animate-in fade-in duration-200">
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
                      onSelectChat={(id: string): void => {
                        addToRecent(searchQuery);
                        setSearchQuery("");
                        setIsFocused(false);
                        navigate({
                          to: "/chat/$chatId",
                          params: { chatId: id },
                        });
                      }}
                      onSelectUser={handleSelectUser}
                    />
                  ) : (
                    <div className="flex flex-col">
                      {recentSearches.length > 0 && (
                        <div className="px-4 pt-4 pb-2">
                          <div className="flex items-center justify-between mb-2 px-1">
                            <span className="text-[11px] font-bold text-muted-foreground/70 tracking-wider">
                              RECENT SEARCHES
                            </span>
                            <button
                              onMouseDown={(e: React.MouseEvent): void =>
                                e.preventDefault()
                              }
                              onClick={handleClearAll}
                              className="text-[11px] font-bold text-sky-500 hover:text-sky-400 transition-colors"
                            >
                              Clear all
                            </button>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {recentSearches.map((s: string, i: number) => (
                              <div
                                key={i}
                                onClick={(): void => setSearchQuery(s)}
                                className="group flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted/60 transition-all cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <History className="h-4 w-4 text-muted-foreground/60" />
                                  <span className="text-[14px] text-foreground/90 font-medium">
                                    {s}
                                  </span>
                                </div>
                                <button
                                  onMouseDown={(e: React.MouseEvent): void =>
                                    e.preventDefault()
                                  }
                                  onClick={(e: React.MouseEvent): void =>
                                    removeFromRecent(e, s)
                                  }
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-full transition-all"
                                >
                                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col items-center justify-center py-24 px-12 text-center">
                        <div className="w-14 h-14 bg-muted/40 rounded-2xl flex items-center justify-center mb-5">
                          <Search className="h-7 w-7 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-[15px] font-bold text-foreground mb-1.5">
                          Search for chats or users
                        </h3>
                        <p className="text-[13px] text-muted-foreground/80 max-w-55 leading-relaxed font-medium">
                          Find existing conversations or start new ones by
                          typing a name.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : isLoadingChats && chats.length === 0 ? (
                <div className="p-4 space-y-4">
                  {[...Array(6)].map((_: unknown, i: number) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : chats.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-700">
                  <div className="relative mb-6 select-none pointer-events-none">
                    <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative w-20 h-20 bg-muted/30 rounded-[2rem] flex items-center justify-center rotate-3 border border-border/50 shadow-inner">
                      <Search className="h-10 w-10 text-primary/30 -rotate-3" />
                    </div>
                  </div>
                  <div className="space-y-2 text-center max-w-60">
                    <h3 className="text-[16px] font-bold tracking-tight text-foreground">
                      No conversations yet
                    </h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      Search for your friends or colleagues to start messaging.
                    </p>
                  </div>
                  <div className="mt-8">
                    <Button
                      variant="secondary"
                      onClick={(): void => {
                        inputRef.current?.focus();
                        setIsFocused(true);
                      }}
                      className="rounded-full px-6 h-10 font-semibold bg-primary/10 text-primary hover:bg-primary/20 border-none transition-all"
                    >
                      Start searching
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col animate-in fade-in duration-300">
                  {pinnedChats.length > 0 && (
                    <div className="flex flex-col">
                      <div className="px-4 pt-4 pb-2 text-[11px] font-bold text-muted-foreground/65 flex items-center gap-1">
                        <BsFillPinFill className="h-3 w-3" /> PINNED CHATS
                      </div>
                      <SidebarMenu>
                        {pinnedChats.map((chat: ApolloChat) => (
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
                      <div className="px-4 pt-4 pb-2 text-[11px] font-bold text-muted-foreground/65">
                        ALL CHATS
                      </div>
                      <SidebarMenu>
                        {otherChats.map((chat: ApolloChat) => (
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
          className="p-4 border-t border-border/5 bg-muted/2 hover:bg-muted/10 transition-colors cursor-pointer group"
          onClick={(): void => setSettingsOpen(true)}
        >
          {isLoadingMe || !user ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 border border-border/10 rounded-full shrink-0">
                  <AvatarImage
                    src={user.photoUrl || undefined}
                    alt={fullName}
                    className="aspect-square object-cover"
                  />
                  <AvatarFallback className="font-bold text-[10px] bg-primary/10 text-primary uppercase">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[13px] font-semibold truncate text-foreground leading-none">
                      {fullName}
                    </span>
                    {user.isVerified && (
                      <MdVerified
                        className="text-[#2196f3] shrink-0 text-[14px]"
                        title="Verified"
                      />
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium leading-none mt-1">
                    Settings
                  </span>
                </div>
              </div>

              <Settings className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
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
