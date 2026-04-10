import { useLazyLoadQuery } from "react-relay";
import type { useMeQuery } from "./__generated__/useMeQuery.graphql";
import meQueryNode from "./__generated__/useMeQuery.graphql";

export function useMe(): useMeQuery["response"] {
  console.log("useMe called");
  return useLazyLoadQuery<useMeQuery>(
    meQueryNode,
    {},
    { fetchPolicy: "store-and-network" },
  );
}
