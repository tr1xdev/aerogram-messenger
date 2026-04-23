import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useTransition,
  Suspense,
} from "react";
import type {
  ReactElement,
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
} from "react";
import { useRouterState, useNavigate, useParams } from "@tanstack/react-router";
import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import {
  Loader2,
  Search,
  MoreVertical,
  History,
  X,
  SettingsIcon,
} from "lucide-react";
import { MdVerified } from "react-icons/md";
import { HiDownload } from "react-icons/hi";
import { BsFillPinFill } from "react-icons/bs";
import { toast } from "sonner";
import type { RecordSourceSelectorProxy, RecordProxy } from "relay-runtime";

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
import { NewChatDialog } from "@/features/chat/ui/new-chat-dialog";
import { ChatMenuItem } from "@/features/chat/ui/chat-menu-item";
import { SettingsDialog } from "@/features/settings/ui/settings-dialog";
import { SearchResults } from "@/features/chat/ui/search-results";
import { useSearchUsers } from "@/features/chat/lib";
import { useConnectionStore } from "@/store/connection";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import type { Chat, User } from "@/entities/chat/model/types";
import type {
  appSidebarQuery as AppSidebarQueryType,
  appSidebarQuery$data,
} from "./__generated__/appSidebarQuery.graphql";
import type {
  appSidebarCreateMutation as AppSidebarCreateMutationType,
  appSidebarCreateMutation$variables,
} from "./__generated__/appSidebarCreateMutation.graphql";
import type { chatMenuItem_chat$key } from "@/features/chat/ui/__generated__/chatMenuItem_chat.graphql";
import { UserAvatar } from "@/components/user-avatar";

const appSidebarQuery = graphql`
  query appSidebarQuery {
    me {
      id
      username
      firstName
      lastName
      photoUrl
      isVerified
      ...settingsDialog_user
    }
    myChats {
      __typename
      ... on ChatList {
        chats {
          id
          title
          type
          photoUrl
          unreadCount
          isPinned
          ...chatMenuItem_chat
        }
      }
      ... on Error {
        message
      }
    }
  }
`;

const createChatMutation = graphql`
  mutation appSidebarCreateMutation($userID: ID!) {
    createDirectChat(userID: $userID) {
      __typename
      ... on Chat {
        id
        type
        title
        photoUrl
        unreadCount
        isPinned
      }
      ... on ForbiddenError {
        message
      }
      ... on ValidationError {
        message
      }
      ... on InternalError {
        message
      }
    }
  }
`;

export type SidebarChat = {
  readonly id: string;
  readonly isPinned: boolean;
  readonly photoUrl: string | null | undefined;
  readonly title: string;
  readonly type: string;
  readonly unreadCount: number;
};

type SidebarMe = NonNullable<AppSidebarQueryType["response"]["me"]>;
type MyChatsType = AppSidebarQueryType["response"]["myChats"];
type ChatDialogMode = "SELECT" | "GROUP" | "CHANNEL";

type Folder = {
  readonly id: string;
  readonly label: string;
  readonly unread: number;
};

type IndicatorStyle = {
  readonly left: number;
  readonly width: number;
};

const SEARCH_DEBOUNCE_MS: number = 250;
const RECENT_SEARCHES_KEY: string = "recent_searches";
const MAX_RECENT_SEARCHES: number = 10;

function AppSidebarInner(): ReactElement {
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState<boolean>(false);
  const [newChatMode, setNewChatMode] = useState<ChatDialogMode>("SELECT");
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({
    left: 0,
    width: 0,
  });
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const [recentSearches, setRecentSearches] = useState<readonly string[]>(
    (): readonly string[] => {
      if (typeof window === "undefined") return [];
      try {
        const saved: string | null = localStorage.getItem(RECENT_SEARCHES_KEY);
        return saved ? (JSON.parse(saved) as string[]) : [];
      } catch {
        return [];
      }
    },
  );

  const foldersRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const { chatId }: { chatId?: string } = useParams({ strict: false });
  const pathname: string = useRouterState().location.pathname;

  const isWsConnected: boolean = useConnectionStore(
    (s: { readonly isWsConnected: boolean }): boolean => s.isWsConnected,
  );
  const isUpdating: boolean = useConnectionStore(
    (s: { readonly isUpdating: boolean }): boolean => s.isUpdating,
  );
  const isMobile: boolean = useIsMobile();

  const data: appSidebarQuery$data = useLazyLoadQuery<AppSidebarQueryType>(
    appSidebarQuery,
    {},
    { fetchPolicy: "store-and-network" },
  );

  const globalSearchData: { readonly searchUsers?: readonly User[] | null } =
    useSearchUsers(debouncedQuery) as {
      readonly searchUsers?: readonly User[] | null;
    };

  const [commitCreate] =
    useMutation<AppSidebarCreateMutationType>(createChatMutation);

  const user: SidebarMe | null = data.me;

  const chats: readonly SidebarChat[] = useMemo((): readonly SidebarChat[] => {
    const myChats: MyChatsType = data.myChats;
    if (myChats?.__typename === "ChatList" && myChats.chats) {
      return myChats.chats as unknown as readonly SidebarChat[];
    }
    return [] as readonly SidebarChat[];
  }, [data.myChats]);

  const pinnedChats: readonly SidebarChat[] =
    useMemo((): readonly SidebarChat[] => {
      return chats.filter((c: SidebarChat): boolean => c.isPinned);
    }, [chats]);

  const otherChats: readonly SidebarChat[] =
    useMemo((): readonly SidebarChat[] => {
      return chats.filter((c: SidebarChat): boolean => !c.isPinned);
    }, [chats]);

  const fullName: string = useMemo((): string => {
    if (!user) return "";
    const first: string = user.firstName?.trim() ?? "";
    const last: string = user.lastName?.trim() ?? "";
    if (!first && !last) return user.username ?? "";
    return `${first} ${last}`.trim();
  }, [user]);

  const folders: readonly Folder[] = useMemo((): readonly Folder[] => {
    const totalUnread: number = chats.reduce(
      (acc: number, chat: SidebarChat): number => acc + (chat.unreadCount || 0),
      0,
    );
    return [{ id: "all", label: "All chats", unread: totalUnread }];
  }, [chats]);

  const filteredLocalChats: readonly SidebarChat[] =
    useMemo((): readonly SidebarChat[] => {
      const q: string = searchQuery.trim().toLowerCase();
      if (!q) return [];
      return chats.filter((c: SidebarChat): boolean =>
        c.title.toLowerCase().includes(q),
      );
    }, [searchQuery, chats]);

  useEffect((): (() => void) => {
    const handler: number = window.setTimeout((): void => {
      startTransition((): void => {
        setDebouncedQuery(searchQuery);
      });
    }, SEARCH_DEBOUNCE_MS);
    return (): void => window.clearTimeout(handler);
  }, [searchQuery]);

  const updateIndicator = useCallback((): void => {
    window.requestAnimationFrame((): void => {
      const container: HTMLDivElement | null = foldersRef.current;
      if (!container) return;
      const active: HTMLButtonElement | null = container.querySelector(
        `[data-folder-id="${activeFolder}"]`,
      ) as HTMLButtonElement | null;
      const label: HTMLSpanElement | null = active?.querySelector(
        ".folder-label",
      ) as HTMLSpanElement | null;

      if (active && label) {
        setIndicatorStyle({
          left: active.offsetLeft + label.offsetLeft,
          width: label.offsetWidth,
        });
      }
    });
  }, [activeFolder]);

  useEffect((): (() => void) => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return (): void => {
      window.removeEventListener("resize", updateIndicator);
    };
  }, [updateIndicator, chats, pathname]);

  const addToRecent = useCallback((query: string): void => {
    const trimmed: string = query.trim();
    if (!trimmed) return;
    setRecentSearches((prev: readonly string[]): readonly string[] => {
      const updated: string[] = [
        trimmed,
        ...prev.filter((s: string): boolean => s !== trimmed),
      ].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFromRecent = useCallback(
    (e: MouseEvent, query: string): void => {
      e.stopPropagation();
      const updated: string[] = recentSearches.filter(
        (s: string): boolean => s !== query,
      );
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    },
    [recentSearches],
  );

  const handleClearAll = useCallback((e: MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  const openNewChat = (mode: ChatDialogMode): void => {
    setNewChatMode(mode);
    setIsNewChatOpen(true);
  };

  const handleSelectUser = useCallback(
    (userId: string): void => {
      if (isCreating) return;
      setIsCreating(true);

      const variables: appSidebarCreateMutation$variables = { userID: userId };

      commitCreate({
        variables,
        updater: (store: RecordSourceSelectorProxy): void => {
          const payload: RecordProxy | null =
            store.getRootField("createDirectChat");
          if (!payload || payload.getType() !== "Chat") return;

          const root: RecordProxy = store.getRoot();
          const myChatsRec: RecordProxy | null =
            root.getLinkedRecord("myChats");

          if (myChatsRec?.getType() === "ChatList") {
            const chatList: readonly RecordProxy[] =
              myChatsRec.getLinkedRecords("chats") ?? [];
            const payloadId: string | null = payload.getValue("id") as
              | string
              | null;

            const alreadyExists: boolean = chatList.some(
              (c: RecordProxy): boolean => c.getValue("id") === payloadId,
            );

            if (!alreadyExists) {
              myChatsRec.setLinkedRecords([payload, ...chatList], "chats");
            }
          }
        },
        onCompleted: (
          response: AppSidebarCreateMutationType["response"],
        ): void => {
          setIsCreating(false);
          const res = response.createDirectChat;

          if (res?.__typename === "Chat") {
            if (res.id) {
              if (searchQuery) addToRecent(searchQuery);
              setSearchQuery("");
              setIsFocused(false);
              navigate({
                to: "/chat/$chatId",
                params: { chatId: res.id },
              });
            }
          } else if (
            res &&
            "message" in res &&
            typeof res.message === "string"
          ) {
            toast.error(res.message);
          }
        },
        onError: (): void => {
          setIsCreating(false);
          toast.error("Failed to create chat");
        },
      });
    },
    [isCreating, commitCreate, searchQuery, addToRecent, navigate],
  );

  return (
    <>
      <Sidebar
        collapsible="none"
        className={cn(
          "border-none bg-background flex flex-col h-screen overflow-hidden transition-all duration-300",
          isMobile ? "w-full" : "w-[350px] border-r border-border/50",
        )}
      >
        <SidebarHeader className="px-4 pt-3 shrink-0 bg-background border-none">
          <div className="flex items-center justify-between h-8 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-full flex justify-center">
              {!isWsConnected ? (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-[16px] font-bold tracking-tight text-foreground">
                    Connecting
                  </span>
                </div>
              ) : isUpdating ? (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-[16px] font-bold tracking-tight text-foreground">
                    Updating
                  </span>
                </div>
              ) : (
                <h1 className="text-[16px] font-bold tracking-tight text-foreground animate-in fade-in duration-300">
                  Chats
                </h1>
              )}
            </div>
            <div className="flex-1 flex justify-end items-center gap-1 z-10">
              <NewChatDialog
                open={isNewChatOpen}
                onOpenChange={setIsNewChatOpen}
                initialMode={newChatMode}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full hover:bg-muted/80 transition-colors outline-none text-foreground">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-xl shadow-xl"
                >
                  <DropdownMenuItem
                    className="py-2.5"
                    onClick={(): void => openNewChat("GROUP")}
                  >
                    New group
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="py-2.5"
                    onClick={(): void => openNewChat("CHANNEL")}
                  >
                    New channel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="py-2.5"
                    onClick={(): void => openNewChat("SELECT")}
                  >
                    New private chat
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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

        <SidebarContent className="flex-1 overflow-y-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex flex-col min-h-full pb-24 md:pb-0">
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
                    onChange={(e: ChangeEvent<HTMLInputElement>): void =>
                      setSearchQuery(e.target.value)
                    }
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>): void => {
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
                      onMouseDown={(e: MouseEvent): void => e.preventDefault()}
                      onClick={(e: MouseEvent): void => {
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
                  {folders.map(
                    (f: Folder): ReactElement => (
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
                    ),
                  )}
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
                      localChats={
                        filteredLocalChats as unknown as readonly Chat[]
                      }
                      globalUsers={
                        (globalSearchData?.searchUsers as User[]) ?? []
                      }
                      isLoading={
                        searchQuery !== debouncedQuery ||
                        isPending ||
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
                              onMouseDown={(e: MouseEvent): void =>
                                e.preventDefault()
                              }
                              onClick={handleClearAll}
                              className="text-[11px] font-bold text-sky-500 hover:text-sky-400 transition-colors"
                            >
                              Clear all
                            </button>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {recentSearches.map(
                              (s: string, i: number): ReactElement => (
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
                                    onMouseDown={(e: MouseEvent): void =>
                                      e.preventDefault()
                                    }
                                    onClick={(e: MouseEvent): void =>
                                      removeFromRecent(e, s)
                                    }
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-full transition-all"
                                  >
                                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                                  </button>
                                </div>
                              ),
                            )}
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
              ) : chats.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
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
                    <button
                      onClick={(): void => {
                        inputRef.current?.focus();
                        setIsFocused(true);
                      }}
                      className="rounded-full px-6 h-10 font-semibold bg-primary/10 text-primary hover:bg-primary/20 border-none transition-all"
                    >
                      Start searching
                    </button>
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
                        {pinnedChats.map(
                          (chat: SidebarChat): ReactElement => (
                            <ChatMenuItem
                              key={chat.id}
                              chat={chat as unknown as chatMenuItem_chat$key}
                              isActive={chatId === chat.id}
                              myId={user?.id}
                            />
                          ),
                        )}
                      </SidebarMenu>
                    </div>
                  )}
                  {otherChats.length > 0 && (
                    <div className="flex flex-col">
                      <div className="px-4 pt-4 pb-2 text-[11px] font-bold text-muted-foreground/65">
                        ALL CHATS
                      </div>
                      <SidebarMenu>
                        {otherChats.map(
                          (chat: SidebarChat): ReactElement => (
                            <ChatMenuItem
                              key={chat.id}
                              chat={chat as unknown as chatMenuItem_chat$key}
                              isActive={chatId === chat.id}
                              myId={user?.id}
                            />
                          ),
                        )}
                      </SidebarMenu>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </SidebarContent>

        <SidebarFooter
          className="hidden md:flex p-4 border-t border-border/5 bg-muted/2 hover:bg-muted/10 transition-colors cursor-pointer group"
          onClick={(): void => setSettingsOpen(true)}
        >
          {!user ? (
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
                <UserAvatar
                  src={user.photoUrl}
                  fallback={fullName}
                  size={36}
                  className="border border-border/10"
                />

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

              <SettingsIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
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

function AppSidebarSkeleton(): ReactElement {
  return (
    <Sidebar
      collapsible="none"
      className="border-none bg-background flex flex-col h-screen overflow-hidden transition-all duration-300 w-[350px] border-r border-border/50 hidden md:flex"
    >
      <SidebarHeader className="px-4 pt-3 shrink-0 bg-background border-none">
        <div className="flex items-center justify-between h-8">
          <Skeleton className="h-5 w-16 mx-auto" />
        </div>
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-y-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="px-4 py-2 sticky top-0">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="px-4 pt-4 pb-2">
          <Skeleton className="h-3 w-20 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map(
              (_: unknown, i: number): ReactElement => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border/5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-16" />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppSidebar(): ReactElement | null {
  const { chatId }: { chatId?: string } = useParams({ strict: false });
  const isMobile: boolean = useIsMobile();

  if (isMobile && chatId) {
    return null;
  }

  return (
    <Suspense fallback={<AppSidebarSkeleton />}>
      <AppSidebarInner />
    </Suspense>
  );
}
