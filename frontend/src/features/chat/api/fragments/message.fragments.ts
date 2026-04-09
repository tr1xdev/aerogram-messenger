import { gql } from "@apollo/client";

export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    username
    firstName
    lastName
    email
    status
    photoUrl
    isVerified
    isBot
  }
`;

export const MESSAGE_FIELDS = gql`
  fragment MessageFields on Message {
    id
    chatId
    text
    sentAt
    sequence
    isEdited
    sender {
      id
      username
      firstName
      lastName
    }
    replyTo {
      id
      text
      sender {
        id
        firstName
      }
    }
    forwardedFrom {
      id
      text
      sender {
        id
        firstName
      }
    }
  }
`;
