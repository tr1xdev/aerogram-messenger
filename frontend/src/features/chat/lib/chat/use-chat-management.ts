import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import { toast } from "sonner";
import type { RecordSourceSelectorProxy, RecordProxy } from "relay-runtime";
import type { useChatManagementSearchQuery } from "./__generated__/useChatManagementSearchQuery.graphql";
import type { useChatManagementCreateMutation } from "./__generated__/useChatManagementCreateMutation.graphql";
import type { useChatManagementPinMutation } from "./__generated__/useChatManagementPinMutation.graphql";
import type { useChatManagementDeleteMutation } from "./__generated__/useChatManagementDeleteMutation.graphql";

const searchUsersQuery = graphql`
  query useChatManagementSearchQuery($username: String!) {
    searchUsers(username: $username) {
      id
      username
      firstName
      lastName
      photoUrl
    }
  }
`;

const createChatMutation = graphql`
  mutation useChatManagementCreateMutation($userID: ID!) {
    createDirectChat(userID: $userID) {
      __typename
      ... on Chat {
        id
        type
        title
        photoUrl
        unreadCount
        isPinned
      }
      ... on ForbiddenError {
        message
      }
      ... on ValidationError {
        message
      }
      ... on InternalError {
        message
      }
    }
  }
`;

const pinChatMutation = graphql`
  mutation useChatManagementPinMutation($id: ID!, $pinned: Boolean!) {
    pinChat(id: $id, pinned: $pinned) {
      __typename
      ... on SuccessResult {
        success
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

const deleteChatMutation = graphql`
  mutation useChatManagementDeleteMutation($id: ID!, $forEveryone: Boolean!) {
    deleteChat(id: $id, forEveryone: $forEveryone) {
      __typename
      ... on SuccessResult {
        success
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

export function useSearchUsers(
  username: string,
): useChatManagementSearchQuery["response"] {
  return useLazyLoadQuery<useChatManagementSearchQuery>(
    searchUsersQuery,
    { username },
    {
      fetchPolicy: "store-or-network",
    } as { fetchPolicy: "store-or-network" },
  );
}

export function useChatActions(chatId?: string): {
  createChat: (
    userID: string,
    options?: {
      onCompleted?: (
        response: useChatManagementCreateMutation["response"],
      ) => void;
      onError?: (error: Error) => void;
    },
  ) => void;
  togglePin: (pinned: boolean) => void;
  deleteChat: (forEveryone?: boolean) => void;
} {
  const [createDirect] =
    useMutation<useChatManagementCreateMutation>(createChatMutation);
  const [pin] = useMutation<useChatManagementPinMutation>(pinChatMutation);
  const [remove] =
    useMutation<useChatManagementDeleteMutation>(deleteChatMutation);

  const createChat = (
    userID: string,
    options?: {
      onCompleted?: (
        response: useChatManagementCreateMutation["response"],
      ) => void;
      onError?: (error: Error) => void;
    },
  ): void => {
    createDirect({
      variables: { userID },
      updater: (store: RecordSourceSelectorProxy): void => {
        const payload: RecordProxy | null =
          store.getRootField("createDirectChat") ?? null;
        if (!payload || payload.getType() !== "Chat") return;

        const root: RecordProxy = store.getRoot();
        const myChats: RecordProxy | null =
          root.getLinkedRecord("myChats") ?? null;

        if (myChats && myChats.getType() === "ChatList") {
          const chats: ReadonlyArray<RecordProxy> =
            myChats.getLinkedRecords("chats") ?? [];
          const alreadyExists: boolean = chats.some(
            (c: RecordProxy): boolean =>
              c.getValue("id") === payload.getValue("id"),
          );

          if (!alreadyExists) {
            myChats.setLinkedRecords([payload, ...chats], "chats");
          }
        }
      },
      onCompleted: (
        response: useChatManagementCreateMutation["response"],
      ): void => {
        const res = response.createDirectChat;
        if (res.__typename !== "Chat" && "message" in res) {
          toast.error(res.message as string);
        } else {
          options?.onCompleted?.(response);
        }
      },
      onError: (err: Error): void => {
        toast.error("Failed to create chat");
        options?.onError?.(err);
      },
    });
  };

  const togglePin = (pinned: boolean): void => {
    if (!chatId) return;

    pin({
      variables: { id: chatId, pinned },
      optimisticUpdater: (store: RecordSourceSelectorProxy): void => {
        const chatRecord: RecordProxy | null = store.get(chatId) ?? null;
        if (chatRecord) {
          chatRecord.setValue(pinned, "isPinned");
        }
      },
      onCompleted: (
        response: useChatManagementPinMutation["response"],
      ): void => {
        const res = response.pinChat;
        if (res.__typename !== "SuccessResult" && "message" in res) {
          toast.error(res.message as string);
        }
      },
      onError: (): void => {
        toast.error("Action failed");
      },
    });
  };

  const deleteChat = (forEveryone: boolean = false): void => {
    if (!chatId) return;

    remove({
      variables: { id: chatId, forEveryone },
      updater: (store: RecordSourceSelectorProxy): void => {
        const root: RecordProxy = store.getRoot();
        const myChats: RecordProxy | null =
          root.getLinkedRecord("myChats") ?? null;

        if (myChats && myChats.getType() === "ChatList") {
          const chats: ReadonlyArray<RecordProxy> =
            myChats.getLinkedRecords("chats") ?? [];
          const nextChats: RecordProxy[] = chats.filter(
            (c: RecordProxy): boolean => c.getValue("id") !== chatId,
          );
          myChats.setLinkedRecords(nextChats, "chats");
        }

        store.delete(chatId);
      },
      onCompleted: (
        response: useChatManagementDeleteMutation["response"],
      ): void => {
        const res = response.deleteChat;
        if (res.__typename !== "SuccessResult" && "message" in res) {
          toast.error(res.message as string);
        }
      },
      onError: (): void => {
        toast.error("Failed to delete chat");
      },
    });
  };

  return { createChat, togglePin, deleteChat };
}
