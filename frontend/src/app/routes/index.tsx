import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth";
import { useMyChats } from "@/features/chat/lib/use-chats";
import { NewChatDialog } from "@/features/chat/ui/new-chat-dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatPartner {
  first_name: string;
}

interface LastMessage {
  id: string;
  text: string;
  sentAt: string;
  sender: ChatPartner;
}

interface Chat {
  id: string;
  title: string;
  unreadCount: number;
  lastMessage?: LastMessage;
}

function IndexPage() {
  const navigate = useNavigate();
  const isAuth = useAuthStore((state) => state.isAuth);
  const { data: chats, isLoading } = useMyChats();

  if (!isAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 md:p-10">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Welcome to the Router</CardTitle>
            <CardDescription>Start by logging in or signing up</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button
              onClick={() => navigate({ to: "/login" })}
              className="w-full"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate({ to: "/signup" })}
              variant="outline"
              className="w-full"
            >
              Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-background p-4 md:p-6">
      <Card className="w-full max-w-md flex flex-col h-[calc(100vh-3rem)]">
        <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4 space-y-0">
          <CardTitle className="text-xl">Chats</CardTitle>
          <NewChatDialog />
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !chats || chats.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No chats yet. Start a new one!
              </div>
            ) : (
              <div className="flex flex-col divide-y">
                {(chats as Chat[]).map((chat) => (
                  <Link
                    key={chat.id}
                    to={"/chat/$chatId" as never}
                    params={{ chatId: chat.id } as unknown as never}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors no-underline text-inherit"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {chat.title.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-semibold truncate">{chat.title}</h3>
                        {chat.lastMessage && (
                           <span className="text-xs text-muted-foreground ml-2 shrink-0">
                             {chat.lastMessage && new Date(chat.lastMessage.sentAt).toLocaleTimeString([], {
                               hour: "2-digit",
                               minute: "2-digit",
                             })}
                           </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.lastMessage
                            ? `${chat.lastMessage.sender.first_name}: ${chat.lastMessage.text}`
                            : "No messages yet"}
                        </p>
                        {chat.unreadCount > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground shrink-0">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: IndexPage,
});
