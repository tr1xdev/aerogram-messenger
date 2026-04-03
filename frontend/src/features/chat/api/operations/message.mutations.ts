import { gql } from "@apollo/client";
import { MESSAGE_FIELDS } from "../fragments/message.fragments";

export const SEND_MESSAGE = gql`
  mutation SendMessage(
    $chatId: ID!
    $text: String!
    $isEncrypted: Boolean!
    $encryptionIv: String
    $replyToId: ID
  ) {
    sendMessage(
      chatId: $chatId
      text: $text
      isEncrypted: $isEncrypted
      encryptionIv: $encryptionIv
      replyToId: $replyToId
    ) {
      __typename
      ... on Message {
        ...MessageFields
      }
      ... on ValidationError {
        message
        field
      }
    }
  }
  ${MESSAGE_FIELDS}
`;

export const UPDATE_MESSAGE = gql`
  mutation UpdateMessage($id: ID!, $text: String!) {
    updateMessage(id: $id, text: $text) {
      __typename
      ... on Message {
        id
        text
        isEdited
      }
      ... on ValidationError {
        message
        field
      }
    }
  }
`;

export const EDIT_MESSAGE = UPDATE_MESSAGE;

export const DELETE_MESSAGE = gql`
  mutation DeleteMessage($id: ID!) {
    deleteMessage(id: $id)
  }
`;
