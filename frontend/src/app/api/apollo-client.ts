import { ApolloClient, InMemoryCache, HttpLink, split } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";
import type { Reference } from "@apollo/client";

const httpLink = new HttpLink({
  uri: "http://localhost:8080/query",
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("access_token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:8080/query",
    connectionParams: () => ({
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    }),
  }),
);

const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return (
      def.kind === "OperationDefinition" && def.operation === "subscription"
    );
  },
  wsLink,
  authLink.concat(httpLink),
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          messageHistory: {
            keyArgs: ["chatId"],
            merge(
              existing: Reference[] = [],
              incoming: Reference[],
              { readField },
            ) {
              const merged = [...existing];
              const existingIds = new Set(
                merged.map((ref) => readField("id", ref)),
              );

              incoming.forEach((ref) => {
                if (!existingIds.has(readField("id", ref))) {
                  merged.push(ref);
                }
              });

              return merged;
            },
          },
        },
      },
    },
  }),
});
