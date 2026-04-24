import { type ReactNode, useEffect } from "react";
import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import { useNavigate } from "@tanstack/react-router";
import { JoinError } from "./join-error";
import { JoinCard } from "./join-card";
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

  useEffect((): void => {
    if (
      result.__typename === "Chat" &&
      result.myRole !== "guest" &&
      result.id
    ) {
      navigate({
        to: "/chat/$chatId",
        params: { chatId: result.id },
        replace: true,
      });
    }
  }, [result, navigate]);

  const handleCancel = (): void => {
    if (window.history.length > 2) {
      window.history.back();
    } else {
      navigate({ to: "/", replace: true });
    }
  };

  if (
    result.__typename === "NotFoundError" ||
    result.__typename === "ForbiddenError"
  ) {
    return (
      <JoinError
        message={result.message ?? "An error occurred"}
        onBack={handleCancel}
      />
    );
  }

  if (result.__typename !== "Chat") return null;

  if (result.myRole !== "guest") {
    return null;
  }

  const handleJoin = (): void => {
    commit({
      variables: { slug },
      onCompleted: (response: joinViewMutation["response"]): void => {
        const joinResult = response.joinChatBySlug;
        if (joinResult.__typename === "Chat" && joinResult.id) {
          navigate({
            to: "/chat/$chatId",
            params: { chatId: joinResult.id },
            replace: true,
          });
        }
      },
    });
  };

  return (
    <JoinCard
      title={result.title ?? "Chat"}
      slug={result.slug ?? ""}
      photoUrl={result.photoUrl}
      membersCount={result.membersCount ?? 0}
      type={result.type ?? "GROUP"}
      isPending={isPending}
      onJoin={handleJoin}
      onCancel={handleCancel}
    />
  );
}
