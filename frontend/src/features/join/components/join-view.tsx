import { type ReactNode, useEffect, useState } from "react";
import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import { useNavigate } from "@tanstack/react-router";
import { JoinError } from "./join-error";
import { JoinCard } from "./join-card";
import type { joinViewQuery } from "./__generated__/joinViewQuery.graphql";
import type { joinViewMutation } from "./__generated__/joinViewMutation.graphql";
import type { joinViewInviteMutation } from "./__generated__/joinViewInviteMutation.graphql";

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

const JoinPublicMutation = graphql`
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

const JoinInviteMutation = graphql`
  mutation joinViewInviteMutation($code: String!) {
    joinChatByInvite(inviteCode: $code) {
      __typename
      ... on Chat {
        id
        title
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

interface JoinViewProps {
  slug: string;
}

export function JoinView({ slug }: JoinViewProps): ReactNode {
  const navigate = useNavigate();
  const data = useLazyLoadQuery<joinViewQuery>(JoinQuery, { slug });

  const [commitPublic, isJoiningPublic] =
    useMutation<joinViewMutation>(JoinPublicMutation);
  const [commitInvite, isJoiningInvite] =
    useMutation<joinViewInviteMutation>(JoinInviteMutation);

  const [mutationError, setMutationError] = useState<string | null>(null);

  const result = data.chat;
  const isPending: boolean = isJoiningPublic || isJoiningInvite;

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

  const handleJoin = (): void => {
    setMutationError(null);

    if (result.__typename === "Chat") {
      const hasNoPublicSlug: boolean = !result.slug;
      const isPrivate: boolean = result.type === "PRIVATE";

      if (hasNoPublicSlug || isPrivate) {
        commitInvite({
          variables: { code: slug },
          onCompleted: (response): void => {
            const joinResult = response.joinChatByInvite;
            if (joinResult.__typename === "Chat" && joinResult.id) {
              navigate({
                to: "/chat/$chatId",
                params: { chatId: joinResult.id },
                replace: true,
              });
            } else if ("message" in joinResult) {
              setMutationError(joinResult.message as string);
            }
          },
          onError: (): void => {
            setMutationError("Network error occurred. Please try again.");
          },
        });
      } else {
        commitPublic({
          variables: { slug },
          onCompleted: (response): void => {
            const joinResult = response.joinChatBySlug;
            if (joinResult.__typename === "Chat" && joinResult.id) {
              navigate({
                to: "/chat/$chatId",
                params: { chatId: joinResult.id },
                replace: true,
              });
            } else if ("message" in joinResult) {
              setMutationError(joinResult.message as string);
            }
          },
          onError: (): void => {
            setMutationError("Network error occurred. Please try again.");
          },
        });
      }
    } else if (result.__typename === "NotFoundError") {
      commitInvite({
        variables: { code: slug },
        onCompleted: (response): void => {
          const joinResult = response.joinChatByInvite;
          if (joinResult.__typename === "Chat" && joinResult.id) {
            navigate({
              to: "/chat/$chatId",
              params: { chatId: joinResult.id },
              replace: true,
            });
          } else if ("message" in joinResult) {
            setMutationError(joinResult.message as string);
          }
        },
        onError: (): void => {
          setMutationError("Network error occurred. Please try again.");
        },
      });
    }
  };

  if (result.__typename === "ForbiddenError") {
    return (
      <JoinError
        message={result.message ?? "Access Denied"}
        onBack={handleCancel}
      />
    );
  }

  if (result.__typename === "NotFoundError") {
    return (
      <JoinCard
        title="Private Invite"
        slug={slug}
        photoUrl={null}
        membersCount={0}
        type="GROUP"
        isPending={isPending}
        error={mutationError}
        onJoin={handleJoin}
        onCancel={handleCancel}
      />
    );
  }

  if (result.__typename !== "Chat") return null;

  return (
    <JoinCard
      title={result.title}
      slug={result.slug ?? ""}
      photoUrl={result.photoUrl}
      membersCount={result.membersCount}
      type={result.type}
      isPending={isPending}
      error={mutationError}
      onJoin={handleJoin}
      onCancel={handleCancel}
    />
  );
}
