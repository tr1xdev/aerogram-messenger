import { gql } from "@apollo/client";
import { USER_FIELDS } from "../fragments/message.fragments";

export const GET_ME = gql`
  query GetMe {
    me {
      ...UserFields
      encryptedPrivKey
      encryptionIv
    }
  }
  ${USER_FIELDS}
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    user(id: $id) {
      id
      username
      displayName
      firstName
      lastName
      photoUrl
      bio
      status
      isVerified
      email
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
