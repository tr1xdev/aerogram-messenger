import { useState } from "react";
import { useCreateChat, useSearchUsers } from "../lib/use-chats";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, Loader2 } from "lucide-react";

export function NewChatDialog() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: users, isLoading: isSearching } = useSearchUsers(search);
  const createChat = useCreateChat();

  const handleCreate = async (userID: string) => {
    try {
      await createChat.mutateAsync(userID);
      setOpen(false);
      setSearch("");
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("unauthorized")) {
        alert("Session expired. Please log in again.");
      } else {
        console.error(error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 rounded-full hover:bg-muted transition"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0 gap-0 sm:max-w-[420px]">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle className="text-base font-semibold">
            New chat
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users"
              className="pl-9 h-9"
            />
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users?.length ? (
            users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleCreate(user.id)}
                disabled={createChat.isPending}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/70 transition text-left disabled:opacity-50"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{user.first_name?.[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>
              </button>
            ))
          ) : search.length >= 2 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              No users found
            </p>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-10">
              Start typing to search
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
