import { gql } from "@apollo/client";
import { MESSAGE_FIELDS } from "../fragments/message.fragments";

export const GET_MESSAGE_HISTORY = gql`
  query GetMessageHistory($chatId: ID!, $limit: Int!) {
    messageHistory(chatId: $chatId, limit: $limit) {
      __typename
      ... on MessageConnection {
        messages {
          ...MessageFields
        }
        hasMore
      }
      ... on NotFoundError {
        message
      }
    }
  }
  ${MESSAGE_FIELDS}
`;
