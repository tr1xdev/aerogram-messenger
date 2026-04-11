import { useLazyLoadQuery, graphql } from "react-relay";
import type { useMeQuery } from "./__generated__/useMeQuery.graphql";

const meQuery = graphql`
  query useMeQuery {
    me {
      id
      username
      firstName
      lastName
      photoUrl
    }
  }
`;

export function useMe(): useMeQuery["response"] {
  const response: useMeQuery["response"] = useLazyLoadQuery<useMeQuery>(
    meQuery,
    {},
    { fetchPolicy: "store-and-network" },
  );

  return response;
}
