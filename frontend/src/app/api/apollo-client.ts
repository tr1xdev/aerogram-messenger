import { ApolloClient, InMemoryCache, HttpLink, split } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

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
      access_token: localStorage.getItem("access_token"),
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
      Message: {
        keyFields: ["id"],
      },
      Query: {
        fields: {
          messageHistory: {
            keyArgs: ["chatId"],
            merge(existing = [], incoming = [], { readField }) {
              const merged = existing ? existing.slice(0) : [];
              const seen = new Set<string>();

              for (const item of merged) {
                const id = readField<string>("id", item);
                if (id) seen.add(id);
              }

              for (const item of incoming) {
                const id = readField<string>("id", item);
                if (!id || seen.has(id)) continue;
                seen.add(id);
                merged.push(item);
              }

              return merged;
            },
          },
        },
      },
    },
  }),
});
