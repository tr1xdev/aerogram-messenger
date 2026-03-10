import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useApolloClient } from "@apollo/client/react";
import {
  useSearchUsers,
  useChatActions,
} from "@/features/chat/lib/use-messages";
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
import { Search, Loader2 } from "lucide-react";
import { GET_MY_CHATS } from "../api/chat.gql";
import type { User, Chat } from "@/entities/chat/model/types";
import { FiEdit2 } from "react-icons/fi";

export function NewChatDialog() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { data, loading: isSearching } = useSearchUsers(search);
  const { createChat } = useChatActions("");
  const navigate = useNavigate();
  const client = useApolloClient();

  const users = data?.searchUsers || [];

  const handleCreate = async (userID: string) => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const newChat = await createChat(userID);
      if (newChat) {
        const existingData = client.readQuery<{ myChats: Chat[] }>({
          query: GET_MY_CHATS,
        });

        if (existingData) {
          const alreadyExists = existingData.myChats.some(
            (c) => c.id === newChat.id,
          );
          if (!alreadyExists) {
            client.writeQuery({
              query: GET_MY_CHATS,
              data: {
                myChats: [newChat, ...existingData.myChats],
              },
            });
          }
        }

        setOpen(false);
        setSearch("");
        navigate({ to: "/chat/$chatId", params: { chatId: newChat.id } });
      }
    } catch (error: unknown) {
      console.error("Failed to create chat:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
          <FiEdit2 className="h-6 w-6" />
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
              disabled={isCreating}
            />
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {isSearching || isCreating ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              {isCreating && (
                <p className="text-xs text-muted-foreground">
                  Creating chat...
                </p>
              )}
            </div>
          ) : users.length ? (
            users.map((user: User) => (
              <button
                key={user.id}
                onClick={() => handleCreate(user.id)}
                disabled={isCreating}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/70 transition text-left disabled:opacity-50"
              >
                <Avatar className="h-9 w-9 border border-border/50">
                  <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                    {user.first_name?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-[12px] text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>
              </button>
            ))
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
