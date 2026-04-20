import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import { toast } from "sonner";
import type { RecordSourceSelectorProxy, RecordProxy } from "relay-runtime";
import type { useChatManagementSearchQuery } from "./__generated__/useChatManagementSearchQuery.graphql";
import type { useChatManagementCreateMutation } from "./__generated__/useChatManagementCreateMutation.graphql";
import type { useChatManagementPinMutation } from "./__generated__/useChatManagementPinMutation.graphql";
import type { useChatManagementDeleteMutation } from "./__generated__/useChatManagementDeleteMutation.graphql";
import type {
  useChatManagementCreateComplexMutation,
  ChatType,
} from "./__generated__/useChatManagementCreateComplexMutation.graphql";

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

const createComplexChatMutation = graphql`
  mutation useChatManagementCreateComplexMutation(
    $type: ChatType!
    $participantIds: [ID!]
    $title: String
    $slug: String
  ) {
    createChat(
      type: $type
      participantIds: $participantIds
      title: $title
      slug: $slug
    ) {
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

const createDirectChatMutation = graphql`
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
): useChatManagementSearchQuery["response"] | null {
  const isEnabled: boolean = username.trim().length > 0;
  const data = useLazyLoadQuery<useChatManagementSearchQuery>(
    searchUsersQuery,
    { username: isEnabled ? username : "" },
    {
      fetchPolicy: "store-or-network",
      fetchKey: isEnabled ? username : "disabled",
    },
  );
  return isEnabled ? data : null;
}

export function useChatActions(chatId?: string) {
  const [createDirect] = useMutation<useChatManagementCreateMutation>(
    createDirectChatMutation,
  );
  const [createComplex] = useMutation<useChatManagementCreateComplexMutation>(
    createComplexChatMutation,
  );
  const [pin] = useMutation<useChatManagementPinMutation>(pinChatMutation);
  const [remove] =
    useMutation<useChatManagementDeleteMutation>(deleteChatMutation);

  const updateStoreAfterCreate = (
    store: RecordSourceSelectorProxy,
    payload: RecordProxy | null,
  ): void => {
    if (!payload || payload.getType() !== "Chat") return;
    const root: RecordProxy = store.getRoot();
    const myChats: RecordProxy | null = root.getLinkedRecord("myChats");
    if (myChats && myChats.getType() === "ChatList") {
      const chats: readonly RecordProxy[] =
        myChats.getLinkedRecords("chats") ?? [];
      if (
        !chats.some(
          (c: RecordProxy): boolean =>
            c.getValue("id") === payload.getValue("id"),
        )
      ) {
        myChats.setLinkedRecords([payload, ...chats], "chats");
      }
    }
  };

  const createChat = (
    userID: string,
    options?: { onCompleted?: (id: string) => void },
  ): void => {
    createDirect({
      variables: { userID },
      updater: (store: RecordSourceSelectorProxy): void => {
        updateStoreAfterCreate(store, store.getRootField("createDirectChat"));
      },
      onCompleted: (
        response: useChatManagementCreateMutation["response"],
      ): void => {
        const res = response.createDirectChat;
        if (res.__typename === "Chat") options?.onCompleted?.(res.id);
        else if ("message" in res) toast.error(res.message);
      },
    });
  };

  const createGroupOrChannel = (
    input: {
      type: ChatType;
      title: string;
      participantIds: string[];
      slug?: string;
    },
    options?: { onCompleted?: (id: string) => void },
  ): void => {
    createComplex({
      variables: input,
      updater: (store: RecordSourceSelectorProxy): void => {
        updateStoreAfterCreate(store, store.getRootField("createChat"));
      },
      onCompleted: (
        response: useChatManagementCreateComplexMutation["response"],
      ): void => {
        const res = response.createChat;
        if (res.__typename === "Chat") options?.onCompleted?.(res.id);
        else if ("message" in res) toast.error(res.message);
      },
    });
  };

  const togglePin = (pinned: boolean): void => {
    if (!chatId) return;
    pin({
      variables: { id: chatId, pinned },
      onCompleted: (
        response: useChatManagementPinMutation["response"],
      ): void => {
        const res = response.pinChat;
        if (res.__typename !== "SuccessResult" && "message" in res)
          toast.error(res.message);
      },
    });
  };

  const deleteChat = (forEveryone: boolean = false): void => {
    if (!chatId) return;
    remove({
      variables: { id: chatId, forEveryone },
      updater: (store: RecordSourceSelectorProxy): void => {
        const root: RecordProxy = store.getRoot();
        const myChats: RecordProxy | null = root.getLinkedRecord("myChats");
        if (myChats && myChats.getType() === "ChatList") {
          const chats: readonly RecordProxy[] =
            myChats.getLinkedRecords("chats") ?? [];
          myChats.setLinkedRecords(
            chats.filter(
              (c: RecordProxy): boolean => c.getValue("id") !== chatId,
            ),
            "chats",
          );
        }
        store.delete(chatId);
      },
      onCompleted: (
        response: useChatManagementDeleteMutation["response"],
      ): void => {
        const res = response.deleteChat;
        if (res.__typename !== "SuccessResult" && "message" in res)
          toast.error(res.message);
      },
    });
  };

  return {
    createChat,
    createGroupOrChannel,
    togglePin,
    deleteChat,
  };
}
