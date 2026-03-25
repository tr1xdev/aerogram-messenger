import { gql } from "@apollo/client";
import { BOT_USER_FIELDS } from "./bot.fragments";

export const GET_MY_BOTS = gql`
  query GetMyBots {
    myBots {
      ...BotUserFields
      status
      isVerified
    }
  }
  ${BOT_USER_FIELDS}
`;
