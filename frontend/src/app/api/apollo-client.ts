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
import { createClient } from "graphql-ws";
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

const resolvePendingRequests = (): void => {
  console.log(
    `[AUTH-DEBUG] Resolving ${pendingRequests.length} pending requests`,
  );
  pendingRequests.forEach((callback: PendingRequestCallback) => callback());
  pendingRequests = [];
};

export const logoutAll = async (): Promise<void> => {
  if (isLoggingOut) return;
  isLoggingOut = true;

  console.warn(
    "[AUTH-DEBUG] Logout triggered. Clearing storage and redirecting.",
  );
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");

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
            console.warn(
              `[AUTH-DEBUG] Unauthorized detected in ${operation.operationName}`,
            );

            if (operation.operationName === "RefreshToken") {
              console.error(
                "[AUTH-DEBUG] RefreshToken mutation failed with unauthorized. Logging out.",
              );
              logoutAll();
              observer.next(response);
              observer.complete();
              return;
            }

            const refresh: string | null =
              localStorage.getItem("refresh_token");
            if (!refresh) {
              console.error(
                "[AUTH-DEBUG] No refresh token found in storage. Redirecting to login.",
              );
              logoutAll();
              observer.next(response);
              observer.complete();
              return;
            }

            if (!isRefreshing) {
              isRefreshing = true;
              console.log("[AUTH-DEBUG] Starting REFRESH_TOKEN_MUTATION...");

              client
                .mutate<RefreshTokenResponse>({
                  mutation: REFRESH_TOKEN_MUTATION,
                  variables: { token: refresh },
                })
                .then(({ data }: FetchResult<RefreshTokenResponse>) => {
                  if (data?.refreshToken) {
                    console.log(
                      "[AUTH-DEBUG] Refresh success! Updating tokens.",
                    );
                    localStorage.setItem(
                      "access_token",
                      data.refreshToken.access_token,
                    );
                    localStorage.setItem(
                      "refresh_token",
                      data.refreshToken.refresh_token,
                    );
                    resolvePendingRequests();
                  } else {
                    throw new Error("Refresh mutation returned no data");
                  }
                })
                .catch((err: Error) => {
                  console.error(
                    "[AUTH-DEBUG] Refresh mutation error:",
                    err.message,
                  );
                  pendingRequests = [];
                  logoutAll();
                })
                .finally(() => {
                  isRefreshing = false;
                });
            }

            console.log(
              `[AUTH-DEBUG] Queueing request: ${operation.operationName}`,
            );
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
        error: (err: Error) => {
          console.error(
            `[AUTH-DEBUG] Network/Execution error in ${operation.operationName}:`,
            err,
          );
          observer.error(err);
        },
        complete: () => {},
      });

      handle = subscription;
      return () => {
        if (handle) handle.unsubscribe();
      };
    });
  },
);

const wsLink: GraphQLWsLink = new GraphQLWsLink(
  createClient({
    url: "ws://localhost:8080/query",
    connectionParams: (): Record<string, string> => {
      const token: string | null = localStorage.getItem("access_token");
      return { Authorization: token ? `Bearer ${token}` : "" };
    },
    on: {
      connected: (): void =>
        useConnectionStore.getState().setIsWsConnected(true),
      closed: (): void => useConnectionStore.getState().setIsWsConnected(false),
      error: (): void => useConnectionStore.getState().setIsWsConnected(false),
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
