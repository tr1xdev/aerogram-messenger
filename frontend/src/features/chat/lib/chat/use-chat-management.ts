import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
import { useEffect } from "react";
import { toast } from "sonner";
import type { RecordSourceSelectorProxy, RecordProxy } from "relay-runtime";
import { logger } from "@/shared/lib/logger";
import type { useChatManagementSearchQuery } from "./__generated__/useChatManagementSearchQuery.graphql";
import type { useChatManagementCreateMutation } from "./__generated__/useChatManagementCreateMutation.graphql";
import type { useChatManagementPinMutation } from "./__generated__/useChatManagementPinMutation.graphql";
import type { useChatManagementDeleteMutation } from "./__generated__/useChatManagementDeleteMutation.graphql";
import type { useChatManagementInviteMutation } from "./__generated__/useChatManagementInviteMutation.graphql";
import type {
  useChatManagementCreateComplexMutation,
  ChatType,
} from "./__generated__/useChatManagementCreateComplexMutation.graphql";

export const deleteFromChatList = (
  store: RecordSourceSelectorProxy,
  chatId: string,
): void => {
  const root: RecordProxy = store.getRoot();
  const myChats: RecordProxy | null = root.getLinkedRecord("myChats");

  if (myChats && myChats.getType() === "ChatList") {
    const chats: readonly RecordProxy[] =
      myChats.getLinkedRecords("chats") ?? [];

    const filteredChats: RecordProxy[] = chats.filter(
      (c: RecordProxy): boolean => (c.getValue("id") as string) !== chatId,
    );

    myChats.setLinkedRecords(filteredChats, "chats");
  }
};

const searchGlobalQuery = graphql`
  query useChatManagementSearchQuery($query: String!) {
    searchGlobal(query: $query) {
      results {
        __typename
        ... on User {
          id
          username
          firstName
          lastName
          photoUrl
        }
        ... on Chat {
          id
          title
          type
          slug
          photoUrl
          membersCount
        }
      }
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
        myRole
        lastReadSequence
        myReadSequence
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
        myRole
        lastReadSequence
        myReadSequence
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

const inviteToChatMutation = graphql`
  mutation useChatManagementInviteMutation($chatID: ID!, $userIds: [ID!]!) {
    inviteToChat(chatID: $chatID, userIds: $userIds) {
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
  query: string,
): useChatManagementSearchQuery["response"] | null {
  const isEnabled: boolean = query.trim().length > 0;

  const data = useLazyLoadQuery<useChatManagementSearchQuery>(
    searchGlobalQuery,
    { query: isEnabled ? query : "" },
    {
      fetchPolicy: "store-or-network",
      fetchKey: isEnabled ? query : "disabled",
      networkCacheConfig: { force: false },
    },
  );

  useEffect((): void => {
    if (isEnabled && data) {
      logger.info("CHAT", "Search execution", {
        query,
        resultsCount: data.searchGlobal?.results?.length ?? 0,
      });
    }
  }, [data, isEnabled, query]);

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
  const [invite] =
    useMutation<useChatManagementInviteMutation>(inviteToChatMutation);

  const updateStoreAfterCreate = (
    store: RecordSourceSelectorProxy,
    payload: RecordProxy | null,
    source: string,
  ): void => {
    if (!payload || payload.getType() !== "Chat") {
      logger.warn(
        "CHAT",
        `Store update skipped: invalid payload from ${source}`,
      );
      return;
    }

    const root: RecordProxy = store.getRoot();
    const myChats: RecordProxy | null = root.getLinkedRecord("myChats");

    if (myChats && myChats.getType() === "ChatList") {
      const chats: readonly RecordProxy[] =
        myChats.getLinkedRecords("chats") ?? [];
      const newId: string = payload.getValue("id") as string;

      const exists: boolean = chats.some(
        (c: RecordProxy): boolean => (c.getValue("id") as string) === newId,
      );

      if (!exists) {
        myChats.setLinkedRecords([payload, ...chats], "chats");
        logger.info("CHAT", "New chat added to store", { id: newId, source });
      }
    }
  };

  const createChat = (
    userID: string,
    options?: { onCompleted?: (id: string) => void },
  ): void => {
    logger.info("CHAT", "Creating direct chat", { userID });
    createDirect({
      variables: { userID },
      updater: (store: RecordSourceSelectorProxy): void => {
        updateStoreAfterCreate(
          store,
          store.getRootField("createDirectChat"),
          "createDirectChat",
        );
      },
      onCompleted: (
        response: useChatManagementCreateMutation["response"],
      ): void => {
        const res = response.createDirectChat;
        if (res.__typename === "Chat") {
          options?.onCompleted?.(res.id);
        } else if ("message" in res) {
          toast.error(res.message);
        }
      },
      onError: (err: Error): void => {
        logger.error("CHAT", "createDirectChat failed", err);
        toast.error("Failed to create chat");
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
    logger.info("CHAT", "Creating complex chat", input);
    createComplex({
      variables: input,
      updater: (store: RecordSourceSelectorProxy): void => {
        updateStoreAfterCreate(
          store,
          store.getRootField("createChat"),
          "createChat",
        );
      },
      onCompleted: (
        response: useChatManagementCreateComplexMutation["response"],
      ): void => {
        const res = response.createChat;
        if (res.__typename === "Chat") {
          options?.onCompleted?.(res.id);
        } else if ("message" in res) {
          toast.error(res.message);
        }
      },
      onError: (err: Error): void => {
        logger.error("CHAT", "createChat failed", err);
        toast.error("Failed to create chat");
      },
    });
  };

  const togglePin = (pinned: boolean): void => {
    if (!chatId) return;
    logger.info("CHAT", "Toggling pin", { chatId, pinned });
    pin({
      variables: { id: chatId, pinned },
      onCompleted: (
        response: useChatManagementPinMutation["response"],
      ): void => {
        const res = response.pinChat;
        if (res.__typename !== "SuccessResult" && "message" in res) {
          toast.error(res.message);
        }
      },
      onError: (err: Error): void => {
        logger.error("CHAT", "pinChat failed", err);
      },
    });
  };

  const deleteChat = (forEveryone: boolean = false): void => {
    if (!chatId) return;
    logger.info("CHAT", "Deleting chat", { chatId, forEveryone });
    remove({
      variables: { id: chatId, forEveryone },
      updater: (store: RecordSourceSelectorProxy): void => {
        deleteFromChatList(store, chatId);
        store.delete(chatId);
      },
      onCompleted: (
        response: useChatManagementDeleteMutation["response"],
      ): void => {
        const res = response.deleteChat;
        if (res.__typename !== "SuccessResult" && "message" in res) {
          toast.error(res.message);
        }
      },
      onError: (err: Error): void => {
        logger.error("CHAT", "deleteChat failed", err);
        toast.error("Failed to delete chat");
      },
    });
  };

  const inviteUsers = (userIds: string[]): void => {
    if (!chatId) return;
    logger.info("CHAT", "Inviting users", { chatId, userIds });
    invite({
      variables: { chatID: chatId, userIds },
      onCompleted: (
        response: useChatManagementInviteMutation["response"],
      ): void => {
        const res = response.inviteToChat;
        if (res.__typename === "SuccessResult") {
          toast.success("Users invited");
        } else if ("message" in res) {
          toast.error(res.message);
        }
      },
      onError: (err: Error): void => {
        logger.error("CHAT", "inviteToChat failed", err);
      },
    });
  };

  return {
    createChat,
    createGroupOrChannel,
    togglePin,
    deleteChat,
    inviteUsers,
  };
}
