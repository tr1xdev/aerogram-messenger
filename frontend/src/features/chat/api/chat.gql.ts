import { gql } from "@apollo/client";

export const GET_SESSIONS = gql`
  query GetSessions($userId: ID!) {
    sessions(userId: $userId) {
      id
      device
      ipAddress
      location
      isActive
      createdAt
    }
  }
`;

export const TERMINATE_ALL_OTHERS = gql`
  mutation TerminateAllOtherSessions {
    terminateAllOtherSessions
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
      publicKey
      encryptedPrivKey
      encryptionIv
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      first_name
      last_name
      username
      status
      publicKey
      encryptedPrivKey
      encryptionIv
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
        lastReadSequence
        user {
          id
          email
          first_name
          last_name
          username
          status
          publicKey
        }
      }
      lastMessage {
        id
        text
        sentAt
        sequence
        isEncrypted
        encryptionIv
        sender {
          id
          first_name
          last_name
          publicKey
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
        lastReadSequence
        user {
          id
          email
          first_name
          last_name
          username
          status
          publicKey
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
      isEncrypted
      encryptionIv
      sender {
        id
        email
        first_name
        last_name
        username
        status
        publicKey
      }
    }
  }
`;

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
      id
      chatId
      text
      sentAt
      sequence
      isEncrypted
      encryptionIv
      sender {
        id
        first_name
        last_name
        publicKey
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
      email
      username
      first_name
      last_name
      status
      publicKey
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
      members {
        user {
          id
          publicKey
        }
      }
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
      isEncrypted
      encryptionIv
      sender {
        id
        email
        username
        first_name
        last_name
        status
        publicKey
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
      lastSeen
    }
  }
`;

export const CHAT_CREATED_SUBSCRIPTION = gql`
  subscription OnChatCreated($userId: String!) {
    chatCreated(userID: $userId) {
      id
      type
      title
      photoUrl
      unreadCount
      isPinned
      createdAt
      lastReadSequence
      lastMessage {
        id
        text
        sentAt
        sequence
        sender {
          id
          username
        }
      }
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUser($id: ID!) {
    getUser(id: $id) {
      id
      email
      first_name
      last_name
      username
      status
    }
  }
`;
