import { gql } from "@apollo/client";
import { MESSAGE_FIELDS } from "../fragments/message.fragments";

export const GET_MESSAGE_HISTORY = gql`
  query GetMessageHistory($chatId: ID!, $limit: Int!, $offset: Int!) {
    messageHistory(chatId: $chatId, limit: $limit, offset: $offset) {
      __typename
      ... on MessageConnection {
        messages {
          ...MessageFields
        }
        hasMore
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
  ${MESSAGE_FIELDS}
`;
