import { gql } from "@apollo/client";

export const CHAT_BASE_FIELDS = gql`
  fragment ChatBaseFields on Chat {
    id
    type
    title
    photoUrl
    unreadCount
    isPinned
    lastReadSequence
  }
`;
