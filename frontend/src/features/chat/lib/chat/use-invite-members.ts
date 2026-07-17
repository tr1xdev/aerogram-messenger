import { graphql, useMutation } from "react-relay";
import type { useInviteMembersMutation } from "./__generated__/useInviteMembersMutation.graphql";

const InviteToChatMutation = graphql`
  mutation useInviteMembersMutation($chatID: ID!, $userIds: [ID!]!) {
    inviteToChat(chatID: $chatID, userIds: $userIds) {
      __typename
      ... on SuccessResult {
        success
      }
      ... on ValidationError {
        message
        field
      }
      ... on ForbiddenError {
        message
      }
      ... on NotFoundError {
        message
      }
      ... on InternalError {
        message
      }
    }
  }
`;

export function useInviteMembers() {
  const [commit, isInFlight] = useMutation<useInviteMembersMutation>(InviteToChatMutation);

  const inviteMembers = (
    chatID: string,
    userIds: string[],
    onSuccess?: () => void,
    onError?: (message: string) => void,
  ) => {
    commit({
      variables: { chatID, userIds },
      onCompleted: (response) => {
        const result = response.inviteToChat;
        if (result.__typename === "SuccessResult" && result.success) {
          onSuccess?.();
          return;
        }
        if ("message" in result && result.message) {
          onError?.(result.message);
          return;
        }
        onError?.("Failed to invite members");
      },
      onError: () => {
        onError?.("Failed to invite members");
      },
    });
  };

  return { inviteMembers, isInFlight };
}
