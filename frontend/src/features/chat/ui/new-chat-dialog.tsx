import { useState, useCallback, type ReactNode, type ChangeEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSearchUsers, useChatActions } from "@/features/chat/lib";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Loader2 } from "lucide-react";
import { FiEdit2 } from "react-icons/fi";
import type { User } from "@/entities/chat/model/types";
import type { useChatManagementCreateMutation } from "@/features/chat/lib/chat/__generated__/useChatManagementCreateMutation.graphql";

export function NewChatDialog(): ReactNode {
  const [open, setOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const searchData = useSearchUsers(search);
  const users: readonly User[] =
    (searchData?.searchUsers as unknown as readonly User[]) || [];

  const { createChat } = useChatActions("");
  const navigate = useNavigate();

  const handleCreate = useCallback(
    async (userID: string): Promise<void> => {
      if (isCreating) return;
      setIsCreating(true);

      try {
        createChat(userID, {
          onCompleted: (
            response: useChatManagementCreateMutation["response"],
          ): void => {
            const res = response.createDirectChat;
            if (res.__typename === "Chat") {
              setOpen(false);
              setSearch("");
              void navigate({
                to: "/chat/$chatId",
                params: { chatId: res.id },
              });
            }
          },
          onError: (err: Error): void => {
            console.error("Failed to create chat:", err);
          },
        });
      } catch (error: unknown) {
        console.error("Critical error:", error);
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, createChat, navigate],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
          <FiEdit2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0 gap-0 sm:max-w-[420px]">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="text-base font-semibold">
            New chat
          </DialogTitle>
          <DialogDescription className="sr-only">
            Search for users to start a new conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>): void =>
                setSearch(e.target.value)
              }
              placeholder="Search users"
              className="pl-9 h-9"
              disabled={isCreating}
            />
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {isCreating ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Creating chat...</p>
            </div>
          ) : users.length ? (
            users.map(
              (user: User): ReactNode => (
                <button
                  key={user.id}
                  type="button"
                  onClick={(): Promise<void> => handleCreate(user.id)}
                  disabled={isCreating}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/70 transition text-left disabled:opacity-50"
                >
                  <Avatar className="h-9 w-9 border border-border/50">
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                      {user.firstName?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[12px] text-muted-foreground truncate">
                      @{user.username}
                    </p>
                  </div>
                </button>
              ),
            )
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-muted-foreground">
                {search.length >= 2
                  ? "No users found"
                  : "Start typing to search"}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
