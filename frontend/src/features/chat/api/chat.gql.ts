import { gql } from "@apollo/client";

export const GET_ME = gql`
  query GetMe {
    me {
      id
      first_name
      last_name
      username
      status
    }
  }
`;

export const GET_MY_CHATS = gql`
  query GetMyChats {
    myChats {
      id
      type
      title
      photoUrl
      unreadCount
      lastReadSequence
      members {
        user {
          id
          first_name
          last_name
          username
          status
        }
      }
      lastMessage {
        id
        text
        sentAt
        sequence
        sender {
          id
          first_name
          last_name
        }
      }
    }
  }
`;

export const GET_CHAT_BY_ID = gql`
  query GetChatById($id: ID!) {
    chat(id: $id) {
      id
      title
      type
      lastReadSequence
      members {
        user {
          id
          first_name
          last_name
          username
          status
        }
      }
    }
  }
`;

export const GET_MESSAGE_HISTORY = gql`
  query GetMessageHistory($chatId: ID!, $limit: Int!, $offset: Int!) {
    messageHistory(chatId: $chatId, limit: $limit, offset: $offset) {
      id
      chatId
      text
      sentAt
      sequence
      isEdited
      sender {
        id
        first_name
        last_name
        username
        status
      }
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($chatId: ID!, $text: String!, $replyToId: ID) {
    sendMessage(chatId: $chatId, text: $text, replyToId: $replyToId) {
      id
      chatId
      text
      sentAt
      sequence
      isEdited
      sender {
        id
        status
      }
    }
  }
`;

export const MARK_DIALOG_AS_READ = gql`
  mutation MarkDialogAsRead($chatID: String!, $lastSequence: Long!) {
    markDialogAsRead(chatID: $chatID, lastSequence: $lastSequence)
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($username: String!) {
    searchUsers(username: $username) {
      id
      username
      first_name
      last_name
      status
    }
  }
`;

export const CREATE_DIRECT_CHAT = gql`
  mutation CreateDirectChat($userID: String!) {
    createDirectChat(userID: $userID) {
      id
      title
      type
      lastReadSequence
      unreadCount
    }
  }
`;

export const MESSAGE_SUBSCRIPTION = gql`
  subscription MessageAdded($chatId: ID!) {
    messageAdded(chatId: $chatId) {
      id
      chatId
      text
      sentAt
      sequence
      isEdited
      sender {
        id
        username
        status
      }
    }
  }
`;

export const DIALOG_READ_SUBSCRIPTION = gql`
  subscription OnDialogRead($chatID: String!) {
    dialogRead(chatID: $chatID) {
      chatID
      userID
      lastSequence
    }
  }
`;

export const USER_PRESENCE_SUBSCRIPTION = gql`
  subscription OnUserStatusChanged($chatId: ID!) {
    userStatusChanged(chatId: $chatId) {
      userId
      status
    }
  }
`;
