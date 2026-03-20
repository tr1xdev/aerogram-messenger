import { gql } from "@apollo/client";
import { MESSAGE_FIELDS } from "../fragments/message.fragments";
import { CHAT_BASE_FIELDS } from "../fragments/chat.fragments";

export const USER_TYPING_SUBSCRIPTION = gql`
  subscription OnUserTyping($chatID: ID!) {
    userTyping(chatID: $chatID) {
      userId
      isTyping
    }
  }
`;

export const MESSAGE_SUBSCRIPTION = gql`
  subscription MessageAdded($chatId: ID!) {
    messageAdded(chatId: $chatId) {
      ...MessageFields
    }
  }
  ${MESSAGE_FIELDS}
`;

export const DIALOG_READ_SUBSCRIPTION = gql`
  subscription OnDialogRead($chatId: ID!) {
    dialogRead(chatId: $chatId) {
      chatId
      userId
      lastSequence
    }
  }
`;

export const USER_PRESENCE_SUBSCRIPTION = gql`
  subscription OnUserStatusChanged($chatId: ID!) {
    userStatusChanged(chatId: $chatId) {
      userId
      status
      lastSeen
    }
  }
`;

export const CHAT_CREATED_SUBSCRIPTION = gql`
  subscription OnChatCreated($userId: ID!) {
    chatCreated(userId: $userId) {
      ...ChatBaseFields
      createdAt
      lastMessage {
        ...MessageFields
      }
    }
  }
  ${CHAT_BASE_FIELDS}
  ${MESSAGE_FIELDS}
`;

export const CHAT_DELETED_SUBSCRIPTION = gql`
  subscription OnChatDeleted($userId: ID!) {
    chatDeleted(userId: $userId)
  }
`;
