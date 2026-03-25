import { gql } from "@apollo/client";
import { BOT_USER_FIELDS } from "./bot.fragments";

export const CREATE_BOT = gql`
  mutation CreateBot(
    $username: String!
    $firstName: String!
    $lastName: String
    $description: String
    $commands: String
  ) {
    createBot(
      username: $username
      firstName: $firstName
      lastName: $lastName
      description: $description
      commands: $commands
    ) {
      __typename
      ... on CreateBotPayload {
        botToken
        user {
          ...BotUserFields
        }
      }
      ... on ValidationError {
        message
        field
      }
      ... on ForbiddenError {
        message
      }
      ... on InternalError {
        message
      }
    }
  }
  ${BOT_USER_FIELDS}
`;
