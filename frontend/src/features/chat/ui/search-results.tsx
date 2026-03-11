import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Chat, User } from "@/entities/chat/model/types";
import { Globe, MessageSquare, Search } from "lucide-react";

interface SearchResultsProps {
  query: string;
  localChats: Chat[];
  globalUsers: User[];
  isLoading: boolean;
  onSelectChat: (chatId: string) => void;
  onSelectUser: (userId: string) => void;
}

export function SearchResults({
  query,
  localChats,
  globalUsers,
  isLoading,
  onSelectChat,
  onSelectUser,
}: SearchResultsProps) {
  if (!query && !isLoading) return null;

  const localUserIds: Set<string> = new Set(
    localChats.flatMap((c: Chat) => c.members.map((m) => m.user.id)),
  );
  const uniqueGlobalUsers: User[] = globalUsers.filter(
    (u: User) => !localUserIds.has(u.id),
  );

  const hasLocal: boolean = localChats.length > 0;
  const hasGlobal: boolean = uniqueGlobalUsers.length > 0;

  if (!isLoading && !hasLocal && !hasGlobal) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] px-10 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-muted/10 p-6 rounded-full mb-6">
          <Search className="h-10 w-10 text-muted-foreground/15" />
        </div>
        <h3 className="text-[17px] font-semibold text-foreground tracking-tight">
          No Results
        </h3>
        <p className="text-[14px] text-muted-foreground/70 mt-1.5 leading-relaxed">
          There were no results for{" "}
          <span className="text-foreground font-semibold">"{query}"</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
      {isLoading ? (
        <div className="px-2 space-y-0.5 pt-2">
          {Array(8)
            .fill(0)
            .map((_, i: number) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3.5">
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-[35%]" />
                  <Skeleton className="h-3 w-[55%] opacity-30" />
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="pb-10">
          {hasLocal && (
            <div className="px-2 pt-2">
              <div className="flex items-center gap-2 px-3 py-2.5 text-[11px] uppercase tracking-[0.1em] font-bold text-muted-foreground/50">
                <MessageSquare className="h-3 w-3" />
                <span>Chats and Contacts</span>
              </div>
              <div className="space-y-0.5">
                {localChats.map((chat: Chat) => (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 active:scale-[0.98] transition-all text-left"
                  >
                    <Avatar className="h-12 w-12 border border-border/40">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {chat.title[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] font-medium truncate text-foreground">
                        {chat.title}
                      </p>
                      <p className="text-[12px] text-muted-foreground/80">
                        Recent interaction
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasGlobal && (
            <div className="px-2 pt-4">
              <div className="flex items-center gap-2 px-3 py-2.5 text-[11px] uppercase tracking-[0.1em] font-bold text-muted-foreground/50">
                <Globe className="h-3 w-3" />
                <span>Global Search</span>
              </div>
              <div className="space-y-0.5">
                {uniqueGlobalUsers.map((user: User) => (
                  <button
                    key={user.id}
                    onClick={() => onSelectUser(user.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 active:scale-[0.98] transition-all text-left"
                  >
                    <Avatar className="h-12 w-12 border border-border/40">
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                        {user.first_name?.[0] || user.username?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14.5px] font-medium truncate text-foreground">
                        {user.first_name} {user.last_name || ""}
                      </p>
                      {user.username && (
                        <p className="text-[12px] text-muted-foreground/80">
                          @{user.username}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
