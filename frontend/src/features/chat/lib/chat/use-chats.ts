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
          title
          photoUrl
          unreadCount
          lastMessage {
            id
            text
            sentAt
            sequence
            sender {
              id
              firstName
              lastName
              displayName
            }
          }
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
        id
        title
        type
        photoUrl
        membersCount
        lastReadSequence
        members {
          user {
            id
            firstName
            lastName
            photoUrl
            displayName
            isBot
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
    { fetchPolicy: "store-and-network" },
  );
}

export function useChatDetails(chatId: string): ChatDetailsResponse {
  return useLazyLoadQuery<useChatsDetailsQuery>(
    chatDetailsQuery,
    { id: chatId },
    { fetchPolicy: "store-and-network" },
  );
}
