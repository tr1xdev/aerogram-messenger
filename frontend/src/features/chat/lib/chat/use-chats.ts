import { graphql, useLazyLoadQuery } from "react-relay";
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
          type
          title
          photoUrl
          unreadCount
          isPinned
          createdAt
          lastReadSequence
          myReadSequence
          lastMessage {
            id
            text
            sentAt
          }
          members {
            user {
              id
              displayName
              photoUrl
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
        id
        type
        title
        photoUrl
        membersCount
        unreadCount
        myReadSequence
        lastReadSequence
        isPinned
        createdAt
        ...useMarkDialog_chat
        members {
          user {
            id
            firstName
            lastName
            displayName
            username
            photoUrl
            isBot
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
