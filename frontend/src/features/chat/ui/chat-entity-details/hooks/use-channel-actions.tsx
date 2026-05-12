import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";
import { toast } from "sonner";
import type { RecordSourceSelectorProxy, RecordProxy } from "relay-runtime";
import type { useChannelActionsUpdateRoleMutation } from "./__generated__/useChannelActionsUpdateRoleMutation.graphql";
import type { useChannelActionsKickMutation } from "./__generated__/useChannelActionsKickMutation.graphql";

const UpdateRoleMutation = graphql`
  mutation useChannelActionsUpdateRoleMutation(
    $chatID: ID!
    $userID: ID!
    $role: String!
  ) {
    updateMemberRole(chatID: $chatID, userID: $userID, role: $role) {
      success
    }
  }
`;

const KickMemberMutation = graphql`
  mutation useChannelActionsKickMutation($chatID: ID!, $userID: ID!) {
    removeChatMember(chatID: $chatID, userID: $userID) {
      __typename
      ... on SuccessResult {
        success
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

export function useChannelActions(chatId: string) {
  const [commitUpdate] =
    useMutation<useChannelActionsUpdateRoleMutation>(UpdateRoleMutation);
  const [commitKick] =
    useMutation<useChannelActionsKickMutation>(KickMemberMutation);

  const toggleAdmin = (
    userId: string,
    currentRole: string,
    name: string,
  ): void => {
    const isCurrentlyAdmin: boolean = currentRole.toUpperCase() === "ADMIN";
    const newRole: string = isCurrentlyAdmin ? "MEMBER" : "ADMIN";

    const updateStore = (store: RecordSourceSelectorProxy): void => {
      const chatProxy: RecordProxy | null | undefined = store.get(chatId);
      if (!chatProxy) return;

      const members: readonly (RecordProxy | null)[] | null | undefined =
        chatProxy.getLinkedRecords("members");
      if (!members) return;

      const memberToUpdate: RecordProxy | null | undefined = members.find(
        (m: RecordProxy | null): boolean =>
          m?.getLinkedRecord("user")?.getDataID() === userId,
      );

      if (memberToUpdate) {
        memberToUpdate.setValue(newRole, "role");
      }
    };

    commitUpdate({
      variables: { chatID: chatId, userID: userId, role: newRole },
      optimisticUpdater: updateStore,
      updater: updateStore,
      onCompleted: (response): void => {
        if (response.updateMemberRole?.success) {
          toast.success(`${name} is now ${newRole.toLowerCase()}`);
        }
      },
      onError: (): void => {
        toast.error("Failed to update role");
      },
    });
  };

  const kickMember = (userId: string, name: string): void => {
    const handleKickStore = (store: RecordSourceSelectorProxy): void => {
      const chatProxy: RecordProxy | null | undefined = store.get(chatId);
      if (!chatProxy) return;

      const members: readonly (RecordProxy | null)[] | null | undefined =
        chatProxy.getLinkedRecords("members");
      if (members) {
        const nextMembers: (RecordProxy | null)[] = members.filter(
          (m: RecordProxy | null): boolean =>
            m?.getLinkedRecord("user")?.getDataID() !== userId,
        );
        chatProxy.setLinkedRecords(nextMembers, "members");
      }

      const count: number | null | undefined = chatProxy.getValue(
        "membersCount",
      ) as number | null | undefined;
      if (typeof count === "number") {
        chatProxy.setValue(Math.max(0, count - 1), "membersCount");
      }
    };

    commitKick({
      variables: { chatID: chatId, userID: userId },
      optimisticUpdater: handleKickStore,
      updater: handleKickStore,
      onCompleted: (response): void => {
        const result = response.removeChatMember;
        if (result.__typename === "SuccessResult") {
          toast.success(`${name} removed from channel`);
        } else if ("message" in result) {
          toast.error(result.message);
        }
      },
      onError: (): void => {
        toast.error("Failed to remove member");
      },
    });
  };

  return { toggleAdmin, kickMember };
}
