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
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Loader2 } from "lucide-react";
import { FiEdit2 } from "react-icons/fi";
import { GET_MY_CHATS } from "../api";
import type { User, Chat, ChatMember } from "@/entities/chat/model/types";

interface MyChatsResponse {
  myChats: {
    __typename: string;
    chats: Chat[];
  };
}

export function NewChatDialog() {
  const [open, setOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const { data, loading: isSearching } = useSearchUsers(search);
  const { createChat } = useChatActions("");
  const navigate = useNavigate();
  const client = useApolloClient();

  const users: User[] = data?.searchUsers || [];

  const handleCreate = async (userID: string): Promise<void> => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const newChat: Chat | undefined = await createChat(userID);
      if (newChat) {
        const existingData: MyChatsResponse | null = client.readQuery({
          query: GET_MY_CHATS,
        });

        const completeChat: Chat = {
          ...newChat,
          isPinned: false,
          photoUrl: newChat.photoUrl ?? null,
          lastMessage: newChat.lastMessage ?? null,
          members:
            newChat.members?.map(
              (m: ChatMember): ChatMember => ({
                ...m,
                user: {
                  ...m.user,
                  email: m.user.email ?? "",
                  status: m.user.status ?? "OFFLINE",
                },
              }),
            ) || [],
        };

        if (existingData?.myChats?.chats) {
          const chatsArray: Chat[] = existingData.myChats.chats;
          const alreadyExists: boolean = chatsArray.some(
            (c: Chat): boolean => c.id === completeChat.id,
          );

          if (!alreadyExists) {
            client.writeQuery({
              query: GET_MY_CHATS,
              data: {
                myChats: {
                  ...existingData.myChats,
                  chats: [completeChat, ...chatsArray],
                },
              },
            });
          }
        }

        setOpen(false);
        setSearch("");
        navigate({ to: "/chat/$chatId", params: { chatId: completeChat.id } });
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                setSearch(e.target.value)
              }
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
