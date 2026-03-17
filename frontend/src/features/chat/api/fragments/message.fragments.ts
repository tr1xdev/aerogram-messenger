import { gql } from "@apollo/client";

export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    username
    firstName
    lastName
    email
    status
    publicKey
    photoUrl
    isVerified
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
    isEncrypted
    encryptionIv
    sender {
      id
      username
      firstName
      lastName
      publicKey
    }
    replyTo {
      id
      text
      isEncrypted
      encryptionIv
      sender {
        id
        firstName
        publicKey
      }
    }
    forwardedFrom {
      id
      text
      isEncrypted
      encryptionIv
      sender {
        id
        firstName
        publicKey
      }
    }
  }
`;
