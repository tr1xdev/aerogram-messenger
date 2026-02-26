import { gql } from "@apollo/client";

export const SEARCH_USERS = gql`
  query SearchUsers($username: String!) {
    searchUsers(username: $username) {
      id
      username
      first_name
      last_name
    }
  }
`;

export const CREATE_DIRECT_CHAT = gql`
  mutation CreateDirectChat($userID: String!) {
    createDirectChat(userID: $userID) {
      id
      title
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
      isRead
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

export const MESSAGE_SUBSCRIPTION = gql`
  subscription OnMessageAdded($chatId: ID!) {
    messageAdded(chatId: $chatId) {
      id
      chatId
      text
      sentAt
      isRead
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

export const GET_ME = gql`
  query GetMe {
    me {
      id
      first_name
      last_name
      username
    }
  }
`;

export const GET_CHAT_BY_ID = gql`
  query GetChatById($id: ID!) {
    chat(id: $id) {
      id
      title
      type
      photoUrl
    }
  }
`;

export const GET_MY_CHATS = gql`
  query GetMyChats {
    myChats {
      id
      type
      title
      unreadCount
      lastMessage {
        id
        text
        sentAt
        isRead
        sender {
          id
          first_name
          last_name
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
      isRead
      sender {
        id
        first_name
        last_name
        username
      }
    }
  }
`;

export const MARK_AS_READ = gql`
  mutation MarkAsRead($chatID: String!, $lastMessageID: String!) {
    markAsRead(chatID: $chatID, lastMessageID: $lastMessageID)
  }
`;

export const MESSAGE_READ_SUBSCRIPTION = gql`
  subscription OnMessageRead($chatID: String!) {
    messageRead(chatID: $chatID) {
      chatID
      userID
      lastMessageID
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
