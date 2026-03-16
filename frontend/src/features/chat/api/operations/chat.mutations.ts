import { gql } from "@apollo/client";
import { CHAT_BASE_FIELDS } from "../fragments/chat.fragments";
import { MESSAGE_FIELDS, USER_FIELDS } from "../fragments/message.fragments";

export const PIN_CHAT = gql`
  mutation PinChat($id: ID!, $pinned: Boolean!) {
    pinChat(id: $id, pinned: $pinned) {
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

export const DELETE_CHAT = gql`
  mutation DeleteChat($id: ID!, $forEveryone: Boolean) {
    deleteChat(id: $id, forEveryone: $forEveryone) {
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

export const MARK_DIALOG_AS_READ = gql`
  mutation MarkDialogAsRead($chatId: String!, $lastSequence: Long!) {
    markDialogAsRead(chatId: $chatId, lastSequence: $lastSequence)
  }
`;

export const CREATE_DIRECT_CHAT = gql`
  mutation CreateDirectChat($userID: String!) {
    createDirectChat(userID: $userID) {
      __typename
      ... on Chat {
        ...ChatBaseFields
        membersCount
        lastMessage {
          ...MessageFields
        }
        members {
          user {
            ...UserFields
          }
        }
      }
      ... on ForbiddenError {
        message
      }
      ... on ValidationError {
        message
        field
      }
      ... on InternalError {
        message
      }
    }
  }
  ${CHAT_BASE_FIELDS}
  ${USER_FIELDS}
  ${MESSAGE_FIELDS}
`;
