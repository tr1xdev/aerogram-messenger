import { gql } from "@apollo/client";

export const BOT_USER_FIELDS = gql`
  fragment BotUserFields on User {
    id
    username
    firstName
    lastName
    photoUrl
    botDescription
    botCommands
    isBot
    isVerified
  }
`;
