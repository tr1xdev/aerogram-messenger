import { useState, useRef, useEffect, useCallback } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  Loader2,
  Settings,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
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
import { useMyChats, useMe } from "@/features/chat/lib/use-messages";
import { useConnectionStore } from "@/store/connection";
import type { Chat, User } from "@/entities/chat/model/types";

export function AppSidebar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeFolder, setActiveFolder] = useState("all");
  const [showSearch, setShowSearch] = useState(true);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const foldersRef = useRef<HTMLDivElement>(null);

  const { data: userData } = useMe();
  const { data: chatsData, loading: isLoading } = useMyChats();
  const pathname = useRouterState().location.pathname;
  const isWsConnected = useConnectionStore((s) => s.isWsConnected);

  const user: User | undefined = userData?.me;
  const chats: Chat[] = chatsData?.myChats ?? [];

  const folders = [
    { id: "all", label: "All chats", unread: 0 },
    { id: "personal", label: "Personal", unread: 2 },
    { id: "news", label: "News", unread: 2 },
    { id: "groups", label: "Groups", unread: 5 },
    { id: "channels", label: "Channels", unread: 1 },
    { id: "bots", label: "Bots", unread: 0 },
    { id: "favorites", label: "Favorites", unread: 3 },
    { id: "archive", label: "Archive", unread: 0 },
  ];

  const updateIndicator = useCallback(() => {
    const container = foldersRef.current;
    if (!container) return;
    const activeButton = container.querySelector<HTMLButtonElement>(
      `[data-folder-id="${activeFolder}"]`,
    );
    if (!activeButton) return;

    const labelSpan =
      activeButton.querySelector<HTMLSpanElement>(".folder-label");
    if (!labelSpan) return;

    const left = labelSpan.offsetLeft - container.scrollLeft;
    const width = labelSpan.offsetWidth;

    setIndicatorStyle({ left, width });
  }, [activeFolder]);

  const checkArrows = useCallback(() => {
    const container = foldersRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 5);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
  }, []);

  useEffect(() => {
    const container = foldersRef.current;
    if (!container) return;

    const handleScroll = () => {
      requestAnimationFrame(() => {
        updateIndicator();
        checkArrows();
      });
    };

    const handleResize = () => {
      updateIndicator();
      checkArrows();
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    updateIndicator();
    checkArrows();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateIndicator, checkArrows]);

  const handleSidebarScroll = useCallback(() => {
    if (scrollRef.current) {
      setShowSearch(scrollRef.current.scrollTop < 30);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", handleSidebarScroll, { passive: true });
      handleSidebarScroll();
    }
    return () => el?.removeEventListener("scroll", handleSidebarScroll);
  }, [handleSidebarScroll]);

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
            <div className="flex-1 flex justify-end items-center gap-1 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full hover:bg-muted/50 transition-colors text-foreground">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>New group</DropdownMenuItem>
                  <DropdownMenuItem>Contacts</DropdownMenuItem>
                  <DropdownMenuItem>Calls</DropdownMenuItem>
                  <DropdownMenuItem>Saved messages</DropdownMenuItem>
                  <DropdownMenuItem>Invite friends</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Telegram Features</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <NewChatDialog />
            </div>
          </div>
          <div className="mt-4 h-px w-full bg-border/10" />
        </SidebarHeader>

        <SidebarContent
          ref={scrollRef}
          className="scrollbar-none overflow-x-hidden"
        >
          <div
            className={`
              sticky top-0 z-10 bg-background transition-opacity duration-200
              ${showSearch ? "opacity-100" : "opacity-0 pointer-events-none"}
            `}
          >
            <div className="px-4 pt-2 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search messages or users"
                  className="w-full h-10 pl-9 pr-4 rounded-full text-sm bg-muted/30 border border-border/30 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="px-4 border-b border-border/10">
            <div className="relative flex items-center group">
              {showLeftArrow && (
                <button
                  onClick={() => scrollFolders("left")}
                  className="absolute left-0 z-20 h-full px-1 bg-gradient-to-r from-background to-transparent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <div
                ref={foldersRef}
                className="flex items-center overflow-x-auto scrollbar-none pb-2 w-full"
                style={{ scrollbarWidth: "none" }}
              >
                <button className="flex-shrink-0 pl-0 pr-3 py-3 text-muted-foreground hover:text-foreground transition-colors">
                  <HiDownload className="h-6 w-6" />
                </button>

                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    data-folder-id={folder.id}
                    onClick={() => setActiveFolder(folder.id)}
                    className={`
                      flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap
                      ${folder.id === activeFolder ? "text-[#58A6FF]" : "text-muted-foreground hover:text-foreground"}
                    `}
                  >
                    <span className="folder-content inline-flex items-center gap-1.5">
                      <span className="folder-label">{folder.label}</span>
                      {folder.unread > 0 && (
                        <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-white text-black">
                          {folder.unread}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
              {showRightArrow && (
                <button
                  onClick={() => scrollFolders("right")}
                  className="absolute right-0 z-20 h-full px-1 bg-gradient-to-l from-background to-transparent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
              <span
                className="absolute bottom-0 h-0.5 bg-[#58A6FF] rounded-full transition-all duration-200 ease-out pointer-events-none"
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                }}
              />
            </div>
          </div>

          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0 pb-16 md:pb-0">
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
          className="hidden md:flex p-4 border-t border-border/10 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer"
        >
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-border/50">
                <AvatarFallback className="font-bold text-xs bg-primary/10 text-primary uppercase">
                  {(user.first_name || user.username || "?")[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-bold truncate">
                  {user.first_name || user.username}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Settings
                </span>
              </div>
              <Settings className="h-4 w-4 text-muted-foreground/50" />
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
