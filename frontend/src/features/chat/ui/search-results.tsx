import { Skeleton } from "@/components/ui/skeleton";
import type { Chat, User, ChatMember } from "@/entities/chat/model/types";
import { Globe, MessageSquare, Search } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

interface SearchResultsProps {
  readonly query: string;
  readonly localChats: readonly Chat[];
  readonly globalUsers: readonly User[];
  readonly isLoading: boolean;
  readonly onSelectChat: (chatId: string) => void;
  readonly onSelectUser: (userId: string) => void;
}

export function SearchResults({
  query,
  localChats,
  globalUsers,
  isLoading,
  onSelectChat,
  onSelectUser,
}: SearchResultsProps): React.ReactNode {
  if (!query && !isLoading) return null;

  const localUserIds: Set<string> = new Set(
    localChats.flatMap((c: Chat): string[] =>
      (c.members ?? []).map((m: ChatMember): string => m.user.id),
    ),
  );

  const uniqueGlobalUsers: readonly User[] = globalUsers.filter(
    (u: User): boolean => !localUserIds.has(u.id),
  );

  const hasLocal: boolean = localChats.length > 0;
  const hasGlobal: boolean = uniqueGlobalUsers.length > 0;

  const displayQuery: string =
    query.length > 128 ? `${query.substring(0, 128)}...` : query;

  if (!isLoading && !hasLocal && !hasGlobal) {
    return (
      <div className="relative w-full h-full">
        <div className="absolute inset-x-0 top-0 flex flex-col items-center px-10 text-center animate-in fade-in zoom-in-95 duration-300 pt-24">
          <div className="bg-muted/10 p-6 rounded-full mb-6 shrink-0">
            <Search className="h-10 w-10 text-muted-foreground/15" />
          </div>
          <h3 className="text-[17px] font-semibold text-foreground tracking-tight">
            No Results
          </h3>
          <p className="text-[14px] text-muted-foreground/70 mt-1.5 leading-relaxed max-w-full break-words">
            There were no results for{" "}
            <span className="text-foreground font-semibold">
              "{displayQuery}"
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {isLoading ? (
        <div className="px-2 space-y-0.5 pt-2 animate-in fade-in duration-200">
          {[...Array(8)].map(
            (_: unknown, i: number): React.ReactNode => (
              <div key={i} className="flex items-center gap-3 px-3 py-3.5">
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-[35%]" />
                  <Skeleton className="h-3 w-[55%] opacity-30" />
                </div>
              </div>
            ),
          )}
        </div>
      ) : (
        <div className="pb-10 animate-in fade-in duration-300">
          {hasLocal && (
            <div className="px-2 pt-2">
              <div className="flex items-center gap-2 px-3 py-2.5 text-[11px] uppercase tracking-[0.1em] font-bold text-muted-foreground/70">
                <MessageSquare className="h-3 w-3" />
                <span>Chats and Contacts</span>
              </div>
              <div className="space-y-0.5">
                {localChats.map(
                  (chat: Chat): React.ReactNode => (
                    <button
                      key={chat.id}
                      onClick={(): void => onSelectChat(chat.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 active:scale-[0.98] transition-all text-left"
                    >
                      <UserAvatar
                        src={chat.photoUrl}
                        fallback={chat.title || "?"}
                        size={48}
                        className="border border-border/40"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14.5px] font-medium truncate text-foreground">
                          {chat.title}
                        </p>
                        <p className="text-[12px] text-muted-foreground/80">
                          Recent interaction
                        </p>
                      </div>
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          {hasGlobal && (
            <div className="px-2 pt-4">
              <div className="flex items-center gap-2 px-3 py-2.5 text-[11px] uppercase tracking-[0.1em] font-bold text-muted-foreground/70">
                <Globe className="h-3 w-3" />
                <span>Global Search</span>
              </div>
              <div className="space-y-0.5">
                {uniqueGlobalUsers.map((user: User): React.ReactNode => {
                  const fullName =
                    `${user.firstName} ${user.lastName || ""}`.trim();
                  return (
                    <button
                      key={user.id}
                      onClick={(): void => onSelectUser(user.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 active:scale-[0.98] transition-all text-left"
                    >
                      <UserAvatar
                        src={user.photoUrl}
                        fallback={fullName || user.username || "?"}
                        size={48}
                        className="border border-border/40"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14.5px] font-medium truncate text-foreground">
                          {fullName}
                        </p>
                        {user.username && (
                          <p className="text-[12px] text-muted-foreground/80">
                            @{user.username}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
