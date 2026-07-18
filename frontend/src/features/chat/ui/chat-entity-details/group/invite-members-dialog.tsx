import { type ReactNode, useState, useEffect, useMemo, Suspense } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { Search, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { inviteMembersDialogQuery } from "./__generated__/inviteMembersDialogQuery.graphql";
import { useInviteMembers } from "@/features/chat/lib/chat/use-invite-members";

const SearchUsersQuery = graphql`
  query inviteMembersDialogQuery($username: String!, $skip: Boolean!) {
    searchUsers(username: $username) @skip(if: $skip) {
      id
      displayName
      firstName
      username
      photoUrl
    }
  }
`;

function SearchResults({
  query,
  debouncedQuery,
  existingMemberIdsSet,
  selectedIds,
  onToggle,
}: {
  query: string;
  debouncedQuery: string;
  existingMemberIdsSet: Set<string>;
  selectedIds: string[];
  onToggle: (user: { id: string; name: string }) => void;
}): ReactNode {
  const data = useLazyLoadQuery<inviteMembersDialogQuery>(
    SearchUsersQuery,
    { username: debouncedQuery, skip: debouncedQuery.length < 2 },
    { fetchPolicy: "network-only" },
  );

  const users = useMemo(() => {
    return (data.searchUsers ?? []).filter(
      (user) => !existingMemberIdsSet.has(user.id),
    );
  }, [data.searchUsers, existingMemberIdsSet]);

  if (query.length < 2) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Type at least 2 characters to search
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No users found
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {users.map((user) => {
        const isSelected = selectedIds.includes(user.id);
        const name = user.displayName ?? user.firstName;

        return (
          <button
            key={user.id}
            type="button"
            onClick={() => onToggle({ id: user.id, name })}
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-semibold">
                {user.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{name}</span>
                {user.username && (
                  <span className="text-xs text-muted-foreground">
                    @{user.username}
                  </span>
                )}
              </div>
            </div>
            {isSelected && <Check className="h-4 w-4 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

export function InviteMembersDialog({
  chatId,
  existingMemberIdsSet,
  open,
  onOpenChange,
}: {
  chatId: string;
  existingMemberIdsSet: Set<string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): ReactNode {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const { inviteMembers, isInFlight } = useInviteMembers();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  const selectedIds = useMemo(() => {
    return selectedUsers.map((u) => u.id);
  }, [selectedUsers]);

  const toggleUser = (user: { id: string; name: string }) => {
    setSelectedUsers((prev) =>
      prev.some((x) => x.id === user.id)
        ? prev.filter((x) => x.id !== user.id)
        : [...prev, user],
    );
  };

  const handleClose = (nextOpen: boolean) => {
    if (isInFlight) return;
    if (!nextOpen) {
      setQuery("");
      setDebouncedQuery("");
      setSelectedUsers([]);
    }
    onOpenChange(nextOpen);
  };

  const handleInvite = () => {
    if (selectedIds.length === 0 || isInFlight) return;
    inviteMembers(chatId, selectedIds, () => {
      handleClose(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => isInFlight && e.preventDefault()} onEscapeKeyDown={(e) => isInFlight && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Invite members</DialogTitle>
          <DialogDescription className="sr-only">
            Search for users by username to invite them to this group chat.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username"
            className="pl-9"
            disabled={isInFlight}
          />
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <span
                key={user.id}
                className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs"
              >
                {user.name}
                <button
                  type="button"
                  disabled={isInFlight}
                  onClick={() => toggleUser(user)}
                  className="rounded-full outline-none focus:ring-1 focus:ring-ring"
                >
                  <X className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" />
                </button>
              </span>
            ))}
          </div>
        )}

        <ScrollArea className="h-72">
          <Suspense
            fallback={
              <div className="py-8 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            }
          >
            <SearchResults
              query={query}
              debouncedQuery={debouncedQuery}
              existingMemberIdsSet={existingMemberIdsSet}
              selectedIds={selectedIds}
              onToggle={toggleUser}
            />
          </Suspense>
        </ScrollArea>

        <Button
          onClick={handleInvite}
          disabled={selectedIds.length === 0 || isInFlight}
          className="w-full"
        >
          {isInFlight
            ? "Inviting..."
            : `Invite${selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
