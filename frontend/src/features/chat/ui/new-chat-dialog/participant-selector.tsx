import { useState, useEffect, useMemo, memo, useCallback } from "react";
import type { ReactElement, ChangeEvent } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSearchUsers } from "../../lib/chat/use-chat-management";

interface SearchedUser {
  readonly __typename?: string;
  readonly id: string;
  readonly username: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly photoUrl: string | null;
}

interface SearchResponse {
  readonly searchGlobal?: {
    readonly results: readonly SearchedUser[];
  } | null;
}

interface ParticipantSelectorProps {
  onSelect: (ids: string[]) => void;
  onBack?: () => void;
  excludeIds?: string[];
  currentUserId?: string;
  currentUsername?: string;
}

interface UserRowProps {
  user: SearchedUser;
  onSelect: (id: string) => void;
}

const UserRow = memo(function UserRow({
  user,
  onSelect,
}: UserRowProps): ReactElement {
  return (
    <button
      type="button"
      onClick={(): void => onSelect(user.id)}
      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 transition-all hover:bg-muted/60 active:scale-[0.98] text-left"
    >
      <Avatar className="h-8 w-8 rounded-full border border-border/40">
        <AvatarImage src={user.photoUrl ?? undefined} />
        <AvatarFallback className="text-[10px] font-medium bg-background text-muted-foreground">
          {(user.firstName?.[0] || user.username?.[0] || "?").toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 overflow-hidden">
        <p className="text-xs font-normal tracking-tight text-foreground truncate">
          {user.firstName} {user.lastName ?? ""}
        </p>
        {user.username && (
          <p className="text-[10px] text-muted-foreground/80 truncate font-mono mt-0.5">
            @{user.username}
          </p>
        )}
      </div>
    </button>
  );
});

export function ParticipantSelector({
  onSelect,
  onBack,
  excludeIds = [],
  currentUserId,
  currentUsername,
}: ParticipantSelectorProps): ReactElement {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");

  useEffect((): (() => void) => {
    const handler: number = window.setTimeout((): void => {
      setDebouncedQuery(searchTerm);
    }, 200);
    return (): void => window.clearTimeout(handler);
  }, [searchTerm]);

  const data = useSearchUsers(debouncedQuery) as SearchResponse | null;

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      setSearchTerm(e.target.value);
    },
    [],
  );

  const handleUserSelect = useCallback(
    (id: string): void => {
      onSelect([id]);
    },
    [onSelect],
  );

  const users: readonly SearchedUser[] =
    useMemo((): readonly SearchedUser[] => {
      const rawResults = data?.searchGlobal?.results ?? [];
      return rawResults.filter((u: SearchedUser): boolean => {
        if (u.__typename !== "User") return false;

        const isSelfId =
          currentUserId && String(u.id).trim() === String(currentUserId).trim();
        const isSelfUsername =
          currentUsername &&
          u.username &&
          u.username.toLowerCase().trim() ===
            currentUsername.toLowerCase().trim();

        return !isSelfId && !isSelfUsername && !excludeIds.includes(u.id);
      });
    }, [
      data?.searchGlobal?.results,
      excludeIds,
      currentUserId,
      currentUsername,
    ]);

  return (
    <div className="space-y-3 py-1">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
        <Input
          placeholder="Search users..."
          className="pl-9 h-9 rounded-lg text-xs bg-muted/40 border-border/50 focus-visible:ring-1 focus-visible:ring-border"
          value={searchTerm}
          onChange={handleInputChange}
        />
      </div>

      <ScrollArea className="h-[240px] -mx-1 px-1">
        <div className="h-full space-y-0.5">
          {!searchTerm && (
            <div className="flex flex-col items-center justify-center h-[220px] text-center p-4 animate-in fade-in duration-200">
              <Users className="h-5 w-5 text-muted-foreground/40 stroke-[1.5] mb-2" />
              <p className="text-xs font-normal text-muted-foreground/70 tracking-tight">
                Type a name or username to start chatting
              </p>
            </div>
          )}

          {searchTerm &&
            users.map(
              (user: SearchedUser): ReactElement => (
                <UserRow
                  key={user.id}
                  user={user}
                  onSelect={handleUserSelect}
                />
              ),
            )}

          {debouncedQuery && users.length === 0 && (
            <p className="text-center text-[11px] text-muted-foreground/70 py-16 tracking-tight">
              No results found
            </p>
          )}
        </div>
      </ScrollArea>

      {onBack && (
        <div className="pt-2 border-t border-border/40">
          <Button
            variant="ghost"
            className="w-full h-8.5 text-xs rounded-lg text-muted-foreground hover:text-foreground"
            onClick={onBack}
          >
            Back
          </Button>
        </div>
      )}
    </div>
  );
}
