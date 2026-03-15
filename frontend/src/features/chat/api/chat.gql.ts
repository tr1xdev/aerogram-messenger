import { gql } from "@apollo/client";

export const DELETE_MESSAGE = gql`
  mutation DeleteMessage($id: ID!) {
    deleteMessage(id: $id)
  }
`;

export const UPDATE_MESSAGE = gql`
  mutation UpdateMessage($id: ID!, $text: String!) {
    updateMessage(id: $id, text: $text) {
      ... on Message {
        id
        text
        isEdited
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

export const GET_SESSIONS = gql`
  query GetSessions($userId: ID!) {
    sessions(userId: $userId) {
      id
      device
      ipAddress
      location
      isActive
      isCurrent
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
      first_name
      last_name
      username
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
      ... on ChatList {
        chats {
          id
          type
          title
          photoUrl
          unreadCount
          isPinned
          lastReadSequence
          membersCount
          lastMessage {
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
              first_name
              username
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

export const GET_CHAT_BY_ID = gql`
  query GetChatById($id: ID, $slug: String) {
    chat(id: $id, slug: $slug) {
      ... on Chat {
        id
        title
        type
        slug
        photoUrl
        membersCount
        unreadCount
        isPinned
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

export const GET_CHAT_DETAILS = gql`
  query GetChatDetails($id: ID!) {
    chat(id: $id) {
      ... on Chat {
        id
        title
        type
        photoUrl
        membersCount
        isPinned
        createdAt
        members {
          lastReadSequence
          user {
            id
            username
            first_name
            last_name
            status
          }
        }
      }
      ... on NotFoundError {
        message
      }
    }
  }
`;

export const GET_MESSAGE_HISTORY = gql`
  query GetMessageHistory($chatId: ID!, $limit: Int!, $offset: Int!) {
    messageHistory(chatId: $chatId, limit: $limit, offset: $offset) {
      ... on MessageConnection {
        messages {
          id
          chatId
          text
          sentAt
          sequence
          isEdited
          isEncrypted
          encryptionIv
          replyTo {
            id
            text
            isEncrypted
            sender {
              id
              first_name
            }
          }
          forwardedFrom {
            id
            text
            sender {
              id
              first_name
            }
          }
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
      ... on Message {
        id
        chatId
        text
        sentAt
        sequence
        isEdited
        isEncrypted
        encryptionIv
        replyTo {
          id
          text
          isEncrypted
          sender {
            id
            first_name
          }
        }
        forwardedFrom {
          id
          text
          sender {
            id
            first_name
          }
        }
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
`;

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
      ... on Chat {
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
      replyTo {
        id
        text
        isEncrypted
        sender {
          id
          first_name
        }
      }
      forwardedFrom {
        id
        text
        sender {
          id
          first_name
        }
      }
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
  subscription OnDialogRead($chatId: String!) {
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

export const EDIT_MESSAGE = gql`
  mutation EditMessage($id: ID!, $text: String!) {
    editMessage(id: $id, text: $text) {
      id
      text
      isEdited
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    user(id: $id) {
      id
      username
      displayName
      photoUrl
      bio
      isVerified
    }
  }
`;

export const TERMINATE_SESSION = gql`
  mutation TerminateSession($id: ID!) {
    terminateSession(id: $id)
  }
`;

export const SEND_TYPING_EVENT = gql`
  mutation SendTypingEvent($chatID: String!) {
    sendTypingEvent(chatID: $chatID)
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const CHAT_DELETED_SUBSCRIPTION = gql`
  subscription OnChatDeleted($userId: ID!) {
    chatDeleted(userId: $userId) {
      chatId
      forEveryone
    }
  }
`;
