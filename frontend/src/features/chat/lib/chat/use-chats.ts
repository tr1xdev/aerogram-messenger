import { useLazyLoadQuery, graphql } from "react-relay";
import type { useChatsMyChatsQuery } from "./__generated__/useChatsMyChatsQuery.graphql";
import type { useChatsDetailsQuery } from "./__generated__/useChatsDetailsQuery.graphql";

export type MyChatsResponse = useChatsMyChatsQuery["response"];
export type ChatDetailsResponse = useChatsDetailsQuery["response"];

const myChatsQuery = graphql`
  query useChatsMyChatsQuery {
    myChats {
      __typename
      ... on ChatList {
        ...useAppTitle_chats
        chats {
          id
          unreadCount
          ...chatMenuItem_chat
        }
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

const chatDetailsQuery = graphql`
  query useChatsDetailsQuery($id: ID!) {
    chat(id: $id) {
      __typename
      ... on Chat {
        ...useMarkDialog_chat
        ...chatMenuItem_chat
        id
        title
        type
        photoUrl
        membersCount
        unreadCount
        isPinned
        lastReadSequence
        myReadSequence
        canWrite
        permissions {
          canSendMessage
          canInviteUsers
          canEditMetadata
          canDeleteMessages
          canAssignAdmins
        }
        members {
          user {
            id
            firstName
            lastName
            photoUrl
            displayName
            isBot
            status
            isVerified
            ...chatHeader_user
          }
        }
      }
      ... on NotFoundError {
        message
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

export function useMyChats(): MyChatsResponse {
  return useLazyLoadQuery<useChatsMyChatsQuery>(
    myChatsQuery,
    {},
    { fetchPolicy: "store-or-network" },
  );
}

export function useChatDetails(chatId: string): ChatDetailsResponse {
  return useLazyLoadQuery<useChatsDetailsQuery>(
    chatDetailsQuery,
    { id: chatId },
    {
      fetchPolicy: "store-or-network",
      fetchKey: chatId,
    },
  );
}
