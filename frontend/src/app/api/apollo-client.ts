import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  split,
  from,
  Observable,
} from "@apollo/client";
import type {
  Reference,
  FetchResult,
  ApolloLink,
  Operation,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { onError } from "@apollo/client/link/error";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";
import type { GraphQLError } from "graphql";
import { REFRESH_TOKEN_MUTATION } from "@/features/auth/api/auth.gql";
import { useConnectionStore } from "@/store/connection";

interface RefreshTokenResponse {
  refreshToken: {
    accessToken: string;
    refreshToken: string;
  };
}

interface InternalErrorLinkArgs {
  graphQLErrors?: readonly GraphQLError[];
  networkError?: Error;
  operation: Operation;
  forward: (op: Operation) => Observable<FetchResult>;
}

const httpLink = new HttpLink({ uri: "http://localhost:8080/query" });

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("access_token");
  return {
    headers: {
      ...(headers as Record<string, string>),
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const errorLink = onError((args) => {
  const { graphQLErrors, operation, forward } =
    args as unknown as InternalErrorLinkArgs;

  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (err.extensions?.code === "UNAUTHENTICATED") {
        if (operation.operationName === "RefreshToken") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
          return;
        }

        const refreshToken = localStorage.getItem("refresh_token");

        if (!refreshToken) {
          window.location.href = "/login";
          return;
        }

        return new Observable<FetchResult>((observer) => {
          client
            .mutate<RefreshTokenResponse>({
              mutation: REFRESH_TOKEN_MUTATION,
              variables: { token: refreshToken },
            })
            .then(({ data }: FetchResult<RefreshTokenResponse>) => {
              if (!data) throw new Error("No refresh data");

              const { accessToken, refreshToken: newRefresh } =
                data.refreshToken;
              localStorage.setItem("access_token", accessToken);
              localStorage.setItem("refresh_token", newRefresh);

              operation.setContext(
                ({ headers = {} }: { headers?: Record<string, string> }) => ({
                  headers: {
                    ...headers,
                    authorization: `Bearer ${accessToken}`,
                  },
                }),
              );

              const subscriber = {
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
              };

              forward(operation).subscribe(subscriber);
            })
            .catch((error: Error) => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              window.location.href = "/login";
              observer.error(error);
            });
        });
      }
    }
  }
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:8080/query",
    connectionParams: () => {
      const token = localStorage.getItem("access_token");
      return { Authorization: token ? `Bearer ${token}` : "" };
    },
    on: {
      connected: () => {
        useConnectionStore.getState().setIsWsConnected(true);
      },
      closed: () => {
        useConnectionStore.getState().setIsWsConnected(false);
      },
      error: () => {
        useConnectionStore.getState().setIsWsConnected(false);
      },
    },
  }),
);

const splitLink: ApolloLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return (
      def.kind === "OperationDefinition" && def.operation === "subscription"
    );
  },
  wsLink,
  from([errorLink, authLink, httpLink]),
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Message: {
        fields: {
          status: {
            read(existing: string = "sent"): string {
              return existing;
            },
          },
        },
      },
      User: {
        fields: {
          first_name: { read: (v: string | undefined): string => v || "" },
          last_name: { read: (v: string | undefined): string => v || "" },
          username: { read: (v: string | undefined): string => v || "" },
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
            ): Reference[] {
              const merged = [...existing];
              const existingIds = new Set(
                merged.map((r) => readField<string>("id", r)),
              );
              incoming.forEach((r) => {
                const id = readField<string>("id", r);
                if (id && !existingIds.has(id)) merged.push(r);
              });
              return merged;
            },
          },
        },
      },
    },
  }),
});
