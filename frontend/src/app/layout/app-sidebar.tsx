import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { useApolloClient } from "@apollo/client/react";
import {
  Loader2,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
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
import type { Chat, User } from "@/entities/chat/model/types";

interface MyChatsData {
  myChats: Chat[];
}

export function AppSidebar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeFolder, setActiveFolder] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const foldersRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const client = useApolloClient();

  const { data: userData } = useMe();
  const { data: chatsData, loading: isLoadingChats } = useMyChats();

  const { data: globalSearchData, loading: isSearchingGlobal } =
    useSearchUsers(debouncedQuery);

  const { createChat } = useChatActions("");

  const navigate = useNavigate();
  const pathname = useRouterState().location.pathname;
  const isWsConnected = useConnectionStore((s) => s.isWsConnected);

  const user: User | undefined = userData?.me;

  const chats: Chat[] = useMemo(() => {
    return chatsData?.myChats ?? [];
  }, [chatsData?.myChats]);

  const totalUnread = useMemo(() => {
    return chats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0);
  }, [chats]);

  const folders = useMemo(
    () => [{ id: "all", label: "All chats", unread: totalUnread }],
    [totalUnread],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredLocalChats = useMemo(() => {
    if (!debouncedQuery) return [];
    return chats.filter((c: Chat) =>
      c.title.toLowerCase().includes(debouncedQuery.toLowerCase()),
    );
  }, [debouncedQuery, chats]);

  const handleSelectUser = async (userId: string) => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const newChat = await createChat(userId);
      if (newChat) {
        const existingData = client.readQuery<MyChatsData>({
          query: GET_MY_CHATS,
        });

        if (existingData) {
          const alreadyExists = existingData.myChats.some(
            (c: Chat) => c.id === newChat.id,
          );
          if (!alreadyExists) {
            client.writeQuery<MyChatsData>({
              query: GET_MY_CHATS,
              data: {
                myChats: [newChat, ...existingData.myChats],
              },
            });
          }
        }
        setSearchQuery("");
        setDebouncedQuery("");
        navigate({ to: "/chat/$chatId", params: { chatId: newChat.id } });
      }
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const updateIndicator = useCallback(() => {
    const container = foldersRef.current;
    if (!container || searchQuery) return;
    const activeButton = container.querySelector<HTMLButtonElement>(
      `[data-folder-id="${activeFolder}"]`,
    );
    const labelSpan =
      activeButton?.querySelector<HTMLSpanElement>(".folder-label");
    if (activeButton && labelSpan) {
      setIndicatorStyle({
        left: activeButton.offsetLeft + labelSpan.offsetLeft,
        width: labelSpan.offsetWidth,
      });
    }
  }, [activeFolder, searchQuery]);

  const checkArrows = useCallback(() => {
    const container = foldersRef.current;
    if (!container) return;
    setShowLeftArrow(container.scrollLeft > 5);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 5,
    );
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchQuery) {
        setSearchQuery("");
        setDebouncedQuery("");
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery) return;
    const container = foldersRef.current;
    if (!container) return;
    const handleUpdate = () => requestAnimationFrame(checkArrows);
    container.addEventListener("scroll", handleUpdate, { passive: true });
    window.addEventListener("resize", updateIndicator);
    updateIndicator();
    checkArrows();
    return () => {
      container.removeEventListener("scroll", handleUpdate);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator, checkArrows, searchQuery]);

  const scrollFolders = (direction: "left" | "right") => {
    const container = foldersRef.current;
    if (!container) return;
    const scrollAmount = 200;
    const newScrollLeft =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;
    container.scrollTo({ left: newScrollLeft, behavior: "smooth" });
  };

  const isActuallySearching =
    searchQuery !== debouncedQuery || isSearchingGlobal;

  return (
    <>
      <Sidebar
        collapsible="none"
        className="w-full border-none bg-background shadow-none flex flex-col h-full select-none"
      >
        <SidebarHeader className="px-4 pt-5 pb-2 shrink-0">
          <div className="flex items-center justify-between h-8 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              {!isWsConnected ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-[14px] font-bold text-muted-foreground">
                    Connecting
                  </span>
                </div>
              ) : (
                <h1 className="text-[16px] font-bold tracking-tight text-foreground">
                  Chats
                </h1>
              )}
            </div>
            <div className="flex-1 flex justify-end items-center gap-0.5 z-10">
              <NewChatDialog />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full hover:bg-muted/60 transition-colors text-foreground focus:outline-none">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuItem className="py-2.5 text-[14px]">
                    New group
                  </DropdownMenuItem>
                  <DropdownMenuItem className="py-2.5 text-[14px]">
                    Saved messages
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="py-2.5 text-[14px]">
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="mt-4 h-px w-full bg-border/5" />
        </SidebarHeader>

        <SidebarContent className="flex flex-col flex-1 overflow-hidden">
          <div className="shrink-0 px-4 pt-2 pb-3 bg-background z-20">
            <div className="relative flex items-center group">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 px-4 rounded-xl text-[14px] bg-muted/40 border border-transparent focus:outline-none focus:border-neutral-700/50 focus:bg-muted/20 transition-all duration-300 text-foreground placeholder:text-transparent"
              />
              <div
                className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300 ease-out gap-2.5 ${isFocused || searchQuery ? "opacity-0 scale-90 -translate-y-2" : "opacity-100 scale-100 translate-y-0"}`}
              >
                <Search className="h-4 w-4 text-muted-foreground/60" />
                <span className="text-[14px] text-muted-foreground/90 font-medium">
                  Search
                </span>
              </div>
              {(searchQuery || isFocused) && (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchQuery("");
                    setDebouncedQuery("");
                    inputRef.current?.blur();
                  }}
                  className="absolute right-3 p-1 rounded-full hover:bg-muted-foreground/15 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {searchQuery ? (
            <div className="flex-1 overflow-y-auto scrollbar-none">
              <SearchResults
                query={debouncedQuery}
                localChats={filteredLocalChats}
                globalUsers={globalSearchData?.searchUsers || []}
                isLoading={isActuallySearching || isCreating}
                onSelectChat={(id) => {
                  setSearchQuery("");
                  setDebouncedQuery("");
                  navigate({ to: "/chat/$chatId", params: { chatId: id } });
                }}
                onSelectUser={handleSelectUser}
              />
            </div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-4 border-b border-border/5 shrink-0 relative overflow-hidden">
                <div className="relative flex items-center h-11">
                  {showLeftArrow && (
                    <button
                      onClick={() => scrollFolders("left")}
                      className="absolute left-0 z-30 h-full px-1.5 bg-gradient-to-r from-background via-background/95 to-transparent text-muted-foreground"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  <div
                    ref={foldersRef}
                    className="flex items-center overflow-x-auto scrollbar-none w-full h-full relative touch-pan-x"
                    style={{ scrollbarWidth: "none" }}
                  >
                    <button className="shrink-0 pr-3 py-3 text-muted-foreground/60 hover:text-foreground">
                      <HiDownload className="h-5 w-5" />
                    </button>
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        data-folder-id={folder.id}
                        onClick={() => setActiveFolder(folder.id)}
                        className={`shrink-0 px-4 py-3 text-[13.5px] font-medium transition-colors whitespace-nowrap relative ${folder.id === activeFolder ? "text-[#58A6FF]" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <span className="folder-label">{folder.label}</span>
                          {folder.unread > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold rounded-full bg-foreground text-background">
                              {folder.unread}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                    <div
                      className="absolute bottom-0 h-[2.5px] bg-[#58A6FF] rounded-t-full transition-all duration-300 ease-out"
                      style={{
                        left: `${indicatorStyle.left}px`,
                        width: `${indicatorStyle.width}px`,
                      }}
                    />
                  </div>
                  {showRightArrow && (
                    <button
                      onClick={() => scrollFolders("right")}
                      className="absolute right-0 z-30 h-full px-1.5 bg-gradient-to-l from-background via-background/95 to-transparent text-muted-foreground"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-none">
                <SidebarGroup className="p-0">
                  <SidebarGroupContent>
                    <SidebarMenu className="gap-0">
                      {isLoadingChats && !chatsData
                        ? Array(10)
                            .fill(0)
                            .map((_, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 px-4 py-3.5"
                              >
                                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2.5 min-w-0">
                                  <Skeleton className="h-3.5 w-32" />
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
              </div>
            </div>
          )}
        </SidebarContent>

        <SidebarFooter
          onClick={() => setSettingsOpen(true)}
          className="hidden md:flex p-4 border-t border-border/5 bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer"
        >
          {user ? (
            <div className="flex items-center gap-3 w-full">
              <Avatar className="h-9 w-9 border border-border/40 shrink-0">
                <AvatarFallback className="font-bold text-[11px] bg-primary/10 text-primary uppercase">
                  {user.first_name?.[0] || user.username?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13.5px] font-bold truncate text-foreground leading-tight">
                  {user.first_name} {user.last_name || ""}
                </span>
                <span className="text-[11px] text-muted-foreground/70 font-medium">
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
