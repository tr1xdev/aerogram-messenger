import { gql } from "@apollo/client";
import { USER_FIELDS, MESSAGE_FIELDS } from "../fragments/message.fragments";
import { CHAT_BASE_FIELDS } from "../fragments/chat.fragments";

export const GET_MY_CHATS = gql`
  query GetMyChats {
    myChats {
      __typename
      ... on ChatList {
        chats {
          ...ChatBaseFields
          membersCount
          members {
            user {
              ...UserFields
            }
          }
          lastMessage {
            ...MessageFields
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
  ${CHAT_BASE_FIELDS}
  ${MESSAGE_FIELDS}
  ${USER_FIELDS}
`;

export const GET_CHAT_BY_ID = gql`
  query GetChatById($id: ID, $slug: String) {
    chat(id: $id, slug: $slug) {
      __typename
      ... on Chat {
        ...ChatBaseFields
        slug
        membersCount
        members {
          lastReadSequence
          user {
            ...UserFields
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
  ${CHAT_BASE_FIELDS}
  ${USER_FIELDS}
`;

export const GET_CHAT_DETAILS = gql`
  query GetChatDetails($id: ID!) {
    chat(id: $id) {
      __typename
      ... on Chat {
        ...ChatBaseFields
        membersCount
        createdAt
        members {
          lastReadSequence
          user {
            ...UserFields
          }
        }
      }
      ... on NotFoundError {
        message
      }
    }
  }
  ${CHAT_BASE_FIELDS}
  ${USER_FIELDS}
`;

export const SEARCH_USERS = gql`
  query SearchUsers($username: String!) {
    searchUsers(username: $username) {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;
