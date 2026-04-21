import { useState, useEffect } from "react";
import type { ReactElement, ChangeEvent } from "react";
import { Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSearchUsers } from "../../lib/chat/use-chat-management";

type SearchData = NonNullable<ReturnType<typeof useSearchUsers>>;
type SearchedUser = NonNullable<SearchData["searchUsers"]>[number];

interface ParticipantSelectorProps {
  isMulti?: boolean;
  onSelect: (ids: string[]) => void;
  onBack?: () => void;
  excludeIds?: string[];
}

export function ParticipantSelector({
  isMulti,
  onSelect,
  onBack,
  excludeIds = [],
}: ParticipantSelectorProps): ReactElement {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect((): (() => void) => {
    const handler: number = window.setTimeout((): void => {
      setDebouncedQuery(searchTerm);
    }, 300);
    return (): void => window.clearTimeout(handler);
  }, [searchTerm]);

  const data: SearchData | null = useSearchUsers(debouncedQuery);

  const toggleUser = (id: string): void => {
    if (!isMulti) {
      onSelect([id]);
      return;
    }
    setSelected((prev: string[]): string[] =>
      prev.includes(id)
        ? prev.filter((i: string): boolean => i !== id)
        : [...prev, id],
    );
  };

  const users: readonly SearchedUser[] = (data?.searchUsers ?? []).filter(
    (u: SearchedUser): boolean => !excludeIds.includes(u.id),
  );

  return (
    <div className="space-y-4 py-4">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          className="pl-9"
          value={searchTerm}
          onChange={(e: ChangeEvent<HTMLInputElement>): void =>
            setSearchTerm(e.target.value)
          }
        />
      </div>

      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-1">
          {users.map(
            (user: SearchedUser): ReactElement => (
              <button
                key={user.id}
                type="button"
                onClick={(): void => toggleUser(user.id)}
                className="flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent text-left"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoUrl ?? undefined} />
                  <AvatarFallback>
                    {(
                      user.firstName?.[0] ||
                      user.username?.[0] ||
                      "?"
                    ).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold leading-none truncate">
                    {user.firstName} {user.lastName ?? ""}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate uppercase font-medium">
                    {user.username ? `@${user.username}` : ""}
                  </p>
                </div>
                {selected.includes(user.id) && (
                  <div className="rounded-full bg-primary p-1 text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            ),
          )}
          {debouncedQuery && users.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-8 font-bold uppercase">
              No users found
            </p>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-3 pt-2 border-t">
        {onBack && (
          <Button
            variant="ghost"
            className="flex-1 text-[10px] font-black uppercase"
            onClick={onBack}
          >
            Back
          </Button>
        )}
        {isMulti && (
          <Button
            className="flex-1 text-[10px] font-black uppercase"
            disabled={selected.length === 0}
            onClick={(): void => onSelect(selected)}
          >
            Add {selected.length} members
          </Button>
        )}
      </div>
    </div>
  );
}
