import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  split,
  from,
  Observable,
  ApolloLink,
} from "@apollo/client";
import type { Reference, FetchResult, Operation } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient, type Message } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { REFRESH_TOKEN_MUTATION } from "@/features/auth/api/auth.gql";
import { useConnectionStore } from "@/store/connection";

interface RefreshTokenResponse {
  refreshToken: {
    access_token: string;
    refresh_token: string;
  };
}

type PendingRequestCallback = () => void;

let isRefreshing: boolean = false;
let isLoggingOut: boolean = false;
let pendingRequests: PendingRequestCallback[] = [];

const authChannel = new BroadcastChannel("auth_sync");

const resolvePendingRequests = (): void => {
  pendingRequests.forEach((callback) => callback());
  pendingRequests = [];
};

authChannel.onmessage = (event) => {
  if (event.data.type === "REFRESH_SUCCESS") {
    resolvePendingRequests();
  }
  if (event.data.type === "LOGOUT" && !isLoggingOut) {
    logoutAll();
  }
};

export const logoutAll = async (): Promise<void> => {
  if (isLoggingOut) return;
  isLoggingOut = true;

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  authChannel.postMessage({ type: "LOGOUT" });

  await client.clearStore();

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

const httpLink: HttpLink = new HttpLink({ uri: "http://localhost:8080/query" });

const authLink: SetContextLink = new SetContextLink((prevContext) => {
  const token: string | null = localStorage.getItem("access_token");
  const prevHeaders: Record<string, string> =
    (prevContext.headers as Record<string, string>) || {};
  return {
    headers: {
      ...prevHeaders,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const interceptorLink: ApolloLink = new ApolloLink(
  (operation: Operation, forward) => {
    return new Observable<FetchResult>((observer) => {
      let handle: { unsubscribe: () => void } | null = null;

      const subscription = forward(operation).subscribe({
        next: (response: FetchResult) => {
          const stringified: string = JSON.stringify(response).toLowerCase();
          const isUnauthorized: boolean =
            stringified.includes("unauthorized") ||
            stringified.includes("unauthenticated") ||
            stringified.includes("session terminated");

          if (isUnauthorized) {
            if (operation.operationName === "RefreshToken") {
              logoutAll();
              observer.next(response);
              observer.complete();
              return;
            }

            const refresh: string | null =
              localStorage.getItem("refresh_token");
            if (!refresh) {
              logoutAll();
              observer.next(response);
              observer.complete();
              return;
            }

            if (!isRefreshing) {
              isRefreshing = true;

              client
                .mutate<RefreshTokenResponse>({
                  mutation: REFRESH_TOKEN_MUTATION,
                  variables: { token: refresh },
                })
                .then(({ data }: FetchResult<RefreshTokenResponse>) => {
                  if (data?.refreshToken) {
                    localStorage.setItem(
                      "access_token",
                      data.refreshToken.access_token,
                    );
                    localStorage.setItem(
                      "refresh_token",
                      data.refreshToken.refresh_token,
                    );
                    authChannel.postMessage({ type: "REFRESH_SUCCESS" });
                    resolvePendingRequests();
                  } else {
                    throw new Error();
                  }
                })
                .catch(() => {
                  pendingRequests = [];
                  logoutAll();
                })
                .finally(() => {
                  isRefreshing = false;
                });
            }

            pendingRequests.push(() => {
              const newToken: string | null =
                localStorage.getItem("access_token");
              operation.setContext((prev: Record<string, unknown>) => ({
                ...prev,
                headers: {
                  ...(prev.headers as Record<string, string>),
                  authorization: newToken ? `Bearer ${newToken}` : "",
                },
              }));

              const retrySub = forward(operation).subscribe({
                next: (val: FetchResult) => observer.next(val),
                error: (err: Error) => observer.error(err),
                complete: () => observer.complete(),
              });

              if (handle) handle.unsubscribe();
              handle = retrySub;
            });
          } else {
            observer.next(response);
            observer.complete();
          }
        },
        error: (err: Error) => observer.error(err),
      });

      handle = subscription;
      return () => {
        if (handle) handle.unsubscribe();
      };
    });
  },
);

const logStyle = (color: string) =>
  `color: ${color}; font-weight: bold; font-family: "JetBrains Mono", monospace;`;
const dimStyle = `color: #888; font-family: "JetBrains Mono", monospace;`;

const wsLink: GraphQLWsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:8080/query",
    lazy: false,
    connectionParams: async () => {
      if (isRefreshing) {
        await new Promise<void>((resolve) => pendingRequests.push(resolve));
      }
      const token = localStorage.getItem("access_token");
      return { Authorization: token ? `Bearer ${token}` : "" };
    },
    keepAlive: 10000,
    connectionAckWaitTimeout: 15000,
    shouldRetry: () => true,
    retryAttempts: Infinity,
    retryWait: async (retries) => {
      const delay =
        retries < 5 ? 1000 : Math.min(1000 * Math.pow(2, retries - 5), 30000);

      const jitter = Math.random() * 0.2 * delay;
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    },
    on: {
      opened: () =>
        console.log("%c[WS]%c socket opened", logStyle("#00d4ff"), dimStyle),

      connected: () => {
        console.log(
          "%c[WS]%c connected to server",
          logStyle("#00ff88"),
          "color: inherit;",
        );
        useConnectionStore.getState().setIsWsConnected(true);
      },

      closed: (event) => {
        console.log(
          "%c[WS]%c connection closed",
          logStyle("#ff4d4d"),
          dimStyle,
          event,
        );
        useConnectionStore.getState().setIsWsConnected(false);
      },

      error: (err) => {
        console.error(
          "%c[WS]%c error occurred",
          logStyle("#ff4d4d"),
          "color: inherit;",
          err,
        );
        useConnectionStore.getState().setIsWsConnected(false);
      },

      message: (msg) => {
        const type = (msg as Message).type || "data";
        console.groupCollapsed(
          `%c[WS]%c message: ${type}`,
          logStyle("#ffca28"),
          dimStyle,
        );
        console.log(msg);
        console.groupEnd();
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
  from([authLink, interceptorLink, httpLink]),
);

export const client: ApolloClient = new ApolloClient({
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
            ): Reference[] {
              const merged: Reference[] = [...existing];
              const existingIds: Set<string> = new Set(
                merged.map((r) => readField<string>("id", r) as string),
              );
              incoming.forEach((r: Reference) => {
                const id: string | undefined = readField<string>("id", r);
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
