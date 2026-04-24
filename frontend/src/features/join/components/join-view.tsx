import { type ReactNode } from "react";
import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Globe, Lock, ChevronLeft } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import type { joinViewQuery } from "./__generated__/joinViewQuery.graphql";
import type { joinViewMutation } from "./__generated__/joinViewMutation.graphql";

const JoinQuery = graphql`
  query joinViewQuery($slug: String!) {
    chat(slug: $slug) {
      __typename
      ... on Chat {
        id
        title
        slug
        photoUrl
        membersCount
        myRole
        type
      }
      ... on ForbiddenError {
        message
      }
      ... on NotFoundError {
        message
      }
    }
  }
`;

const JoinMutation = graphql`
  mutation joinViewMutation($slug: String!) {
    joinChatBySlug(slug: $slug) {
      __typename
      ... on Chat {
        id
        title
      }
      ... on ForbiddenError {
        message
      }
      ... on InternalError {
        message
      }
    }
  }
`;

export function JoinView({ slug }: { slug: string }): ReactNode {
  const navigate = useNavigate();
  const data = useLazyLoadQuery<joinViewQuery>(JoinQuery, { slug });
  const [commit, isPending] = useMutation<joinViewMutation>(JoinMutation);

  const result = data.chat;

  if (
    result.__typename === "NotFoundError" ||
    result.__typename === "ForbiddenError"
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black">Access Denied</h2>
        <p className="text-muted-foreground text-center max-w-[250px]">
          {result.message ?? "An error occurred"}
        </p>
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="font-bold"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  if (result.__typename !== "Chat") return null;

  // Извлекаем переменные, чтобы гарантировать отсутствие undefined для TS
  const chatId = result.id ?? "";
  const chatTitle = result.title ?? "Chat";
  const chatSlug = result.slug ?? "";
  const chatType = result.type ?? "GROUP";

  const handleJoin = (): void => {
    commit({
      variables: { slug },
      onCompleted: (response: joinViewMutation["response"]): void => {
        const joinResult = response.joinChatBySlug;
        if (joinResult.__typename === "Chat" && joinResult.id) {
          navigate({ to: "/chat/$chatId", params: { chatId: joinResult.id } });
        }
      },
    });
  };

  const isMember: boolean = result.myRole !== "guest";
  const isChannel: boolean = chatType === "CHANNEL";

  return (
    <div className="flex items-center justify-center min-h-[85vh] p-4">
      <Card className="w-full max-w-sm overflow-hidden border-none shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] bg-card/60 backdrop-blur-2xl">
        <div className="h-28 bg-gradient-to-br from-primary/10 via-transparent to-background shrink-0" />

        <CardHeader className="relative flex flex-col items-center pt-0 -mt-14">
          <UserAvatar
            src={result.photoUrl}
            fallback={chatTitle}
            size={112}
            className="border-[6px] border-background shadow-2xl rounded-[40px]"
          />

          <div className="mt-6 text-center space-y-1.5">
            <CardTitle className="text-2xl font-black tracking-tight text-foreground/90">
              {chatTitle}
            </CardTitle>
            <div className="flex items-center justify-center gap-2 text-muted-foreground/50 font-bold uppercase tracking-widest text-[10px]">
              <span>@{chatSlug}</span>
              <Separator orientation="vertical" className="h-2.5" />
              <div className="flex items-center gap-1">
                {isChannel ? (
                  <Globe className="w-3 h-3" />
                ) : (
                  <Lock className="w-3 h-3" />
                )}
                {chatType}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          <div className="flex items-center justify-center gap-8 py-5 rounded-[24px] bg-secondary/10 border border-secondary/20">
            <div className="text-center">
              <p className="text-xl font-black text-foreground/80 leading-none">
                {result.membersCount ?? 0}
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">
                Subscribers
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 px-8 pb-8">
          {isMember ? (
            <Button
              className="w-full h-14 rounded-2xl font-black text-base transition-transform active:scale-95 shadow-xl shadow-primary/20"
              onClick={() =>
                navigate({ to: "/chat/$chatId", params: { chatId } })
              }
            >
              Go to Chat
            </Button>
          ) : (
            <Button
              className="w-full h-14 rounded-2xl font-black text-base transition-transform active:scale-95 shadow-xl shadow-primary/20"
              onClick={handleJoin}
              disabled={isPending}
            >
              {isPending ? "Connecting..." : "Join Community"}
            </Button>
          )}

          <Button
            variant="ghost"
            className="w-full h-12 rounded-2xl font-bold text-muted-foreground/40 hover:text-foreground/60 transition-colors"
            onClick={() => window.history.back()}
          >
            Not now
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
