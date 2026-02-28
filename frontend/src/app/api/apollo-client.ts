import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  split,
  type Reference,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

const httpLink = new HttpLink({ uri: "http://localhost:8080/query" });

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("access_token");
  return {
    headers: { ...headers, authorization: token ? `Bearer ${token}` : "" },
  };
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:8080/query",
    connectionParams: () => {
      const token = localStorage.getItem("access_token");
      return { Authorization: token ? `Bearer ${token}` : "" };
    },
    on: {
      connected: () => console.log("[WS] Connected"),
      connecting: () => console.log("[WS] Connecting..."),
      closed: (event) => console.log("[WS] Closed:", event),
      error: (err) => console.error("[WS] Error:", err),
    },
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
      User: {
        fields: {
          first_name: { read: (v: string | undefined) => v || "" },
          last_name: { read: (v: string | undefined) => v || "" },
          username: { read: (v: string | undefined) => v || "" },
        },
      },
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
                merged.map((r) => readField("id", r)),
              );
              incoming.forEach((r) => {
                const id = readField("id", r);
                if (!existingIds.has(id)) merged.push(r);
              });
              return merged;
            },
          },
        },
      },
    },
  }),
});

console.log("[ApolloClient] Initialized HTTP + WS");
