import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  split,
  from,
  Observable,
  ApolloLink,
} from "@apollo/client";
import type {
  Reference,
  Operation,
  FieldFunctionOptions,
} from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient, type Message as WsMessage } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { REFRESH_TOKEN_MUTATION } from "@/features/auth/api/auth.gql";
import { useAuthStore } from "@/store/auth-store";
import { useConnectionStore } from "@/store/connection";
import { toast } from "sonner";

const endpoint: string =
  import.meta.env.VITE_API_URL || "http://localhost:8080/query";
const wsEndpoint: string =
  import.meta.env.VITE_WS_URL || "ws://localhost:8080/query";

interface RefreshTokenResponse {
  refreshToken: {
    accessToken: string;
    refreshToken: string;
  };
}

interface MessageConnection {
  messages: Reference[];
  hasMore: boolean;
  __typename: string;
}

interface ApolloExecutionResult {
  data?: Record<string, unknown> | null;
  errors?: readonly {
    message: string;
    extensions?: Record<string, unknown>;
  }[];
}

type WsNextMessage = {
  type: "next";
  payload: {
    data: {
      messageAdded: {
        text: string;
        sequence: number;
      };
    };
  };
};

type PendingRequestCallback = () => void;

let isRefreshing: boolean = false;
let isLoggingOut: boolean = false;
let pendingRequests: PendingRequestCallback[] = [];

const authChannel: BroadcastChannel = new BroadcastChannel("auth_sync");

const resolvePendingRequests = (): void => {
  pendingRequests.forEach((callback: PendingRequestCallback): void =>
    callback(),
  );
  pendingRequests = [];
};

authChannel.onmessage = (event: MessageEvent): void => {
  if (event.data.type === "REFRESH_SUCCESS") {
    resolvePendingRequests();
  }
  if (event.data.type === "LOGOUT" && !isLoggingOut) {
    logoutAll();
  }
};

export const logoutAll = (): void => {
  if (isLoggingOut) return;
  isLoggingOut = true;

  useAuthStore.getState().logout();

  try {
    authChannel.postMessage({ type: "LOGOUT" });
  } catch (error: unknown) {
    console.error(error);
  }

  client.clearStore().catch((): void => {});

  if (window.location.pathname !== "/sign-in") {
    window.location.replace("/sign-in");
  }
};

const extractStatusCode = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const errObj: Record<string, unknown> = error as Record<string, unknown>;

  if (typeof errObj.statusCode === "number") {
    return errObj.statusCode;
  }

  if (typeof errObj.networkError === "object" && errObj.networkError !== null) {
    const netErr: Record<string, unknown> = errObj.networkError as Record<
      string,
      unknown
    >;
    if (typeof netErr.statusCode === "number") {
      return netErr.statusCode;
    }
  }

  return undefined;
};

const httpLink: HttpLink = new HttpLink({
  uri: endpoint,
});

const authLink: SetContextLink = new SetContextLink(
  (prevContext: Record<string, unknown>) => {
    const token: string | null = useAuthStore.getState().accessToken;
    const prevHeaders: Record<string, string> =
      (prevContext.headers as Record<string, string>) || {};
    return {
      headers: {
        ...prevHeaders,
        authorization: token ? `Bearer ${token}` : "",
      },
    };
  },
);

const logStyle = (color: string): string =>
  `color: ${color}; font-weight: bold; font-family: "JetBrains Mono", monospace;`;
const dimStyle: string = `color: #888; font-family: "JetBrains Mono", monospace;`;

const interceptorLink: ApolloLink = new ApolloLink(
  (operation: Operation, forward) => {
    return new Observable((observer) => {
      let handle: { unsubscribe: () => void } | null = null;

      const subscription = forward(operation).subscribe({
        next: (rawResponse: unknown) => {
          const response: ApolloExecutionResult =
            rawResponse as ApolloExecutionResult;

          if (operation.operationName === "SendMessage") {
            console.log(
              `%c[HTTP][SendMessage]%c Response received:`,
              logStyle("#4caf50"),
              "color: inherit;",
              response.data,
            );
          }

          const hasRateLimitError: boolean = !!response.errors?.some(
            (err) =>
              err.extensions?.code === "RESOURCE_EXHAUSTED" ||
              err.message.toLowerCase().includes("rate limit"),
          );

          if (hasRateLimitError) {
            toast.error("Too many requests. Please wait a moment.", {
              id: "rate-limit-toast",
            });
          }

          const hasFatalAuthError: boolean = !!response.errors?.some((err) =>
            err.message.toLowerCase().includes("session terminated"),
          );

          const hasRefreshableAuthError: boolean = !!response.errors?.some(
            (err) => {
              const msg: string = err.message.toLowerCase();
              return (
                msg.includes("unauthorized") || msg.includes("unauthenticated")
              );
            },
          );

          if (hasFatalAuthError) {
            logoutAll();
            observer.next(response);
            observer.complete();
            return;
          }

          if (hasRefreshableAuthError) {
            if (operation.operationName === "RefreshToken") {
              logoutAll();
              observer.next(response);
              observer.complete();
              return;
            }

            const refresh: string | null = useAuthStore.getState().refreshToken;
            if (!refresh) {
              logoutAll();
              observer.next(response);
              observer.complete();
              return;
            }

            if (!isRefreshing) {
              isRefreshing = true;

              client
                .mutate({
                  mutation: REFRESH_TOKEN_MUTATION,
                  variables: { token: refresh },
                })
                .then((rawResult: unknown): void => {
                  const result: ApolloExecutionResult =
                    rawResult as ApolloExecutionResult;
                  const data: RefreshTokenResponse | null =
                    result.data as unknown as RefreshTokenResponse | null;
                  if (data?.refreshToken) {
                    useAuthStore
                      .getState()
                      .setTokens(
                        data.refreshToken.accessToken,
                        data.refreshToken.refreshToken,
                      );
                    authChannel.postMessage({ type: "REFRESH_SUCCESS" });
                    resolvePendingRequests();
                  } else {
                    throw new Error("No token data in refresh response");
                  }
                })
                .catch((): void => {
                  pendingRequests = [];
                  logoutAll();
                })
                .finally((): void => {
                  isRefreshing = false;
                });
            }

            pendingRequests.push((): void => {
              const newToken: string | null =
                useAuthStore.getState().accessToken;
              operation.setContext((prev: Record<string, unknown>) => ({
                ...prev,
                headers: {
                  ...(prev.headers as Record<string, string>),
                  authorization: newToken ? `Bearer ${newToken}` : "",
                },
              }));

              const retrySub = forward(operation).subscribe({
                next: (val: unknown) =>
                  observer.next(val as ApolloExecutionResult),
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
          const statusCode: number | undefined = extractStatusCode(err);
          const msg: string = err.message.toLowerCase();

          if (statusCode === 429 || msg.includes("rate limit")) {
            toast.error("Rate limit exceeded. Please try again later.", {
              id: "rate-limit-toast",
            });
          }

          if (msg.includes("session terminated") || statusCode === 401) {
            logoutAll();
            return;
          }

          observer.error(err);
        },
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
    url: wsEndpoint,
    lazy: false,
    connectionParams: async () => {
      if (isRefreshing) {
        await new Promise((resolve: (value: void) => void): void => {
          pendingRequests.push(resolve);
        });
      }
      const token: string | null = useAuthStore.getState().accessToken;
      return { authorization: token ? `Bearer ${token}` : "" };
    },
    keepAlive: 10000,
    connectionAckWaitTimeout: 15000,
    shouldRetry: (err: unknown): boolean => {
      const event: CloseEvent = err as CloseEvent;
      return event?.code !== 1000 && event?.reason !== "terminated";
    },
    retryAttempts: Infinity,
    retryWait: async (retries: number) => {
      const delay: number =
        retries < 5 ? 1000 : Math.min(1000 * Math.pow(2, retries - 5), 30000);
      const jitter: number = Math.random() * 0.2 * delay;
      await new Promise((resolve: (value: void) => void): void => {
        setTimeout(resolve, delay + jitter);
      });
    },
    on: {
      opened: (): void =>
        console.log("%c[WS]%c socket opened", logStyle("#00d4ff"), dimStyle),

      connected: (): void => {
        console.log(
          "%c[WS]%c connected to server",
          logStyle("#00ff88"),
          "color: inherit;",
        );
        useConnectionStore.getState().setIsWsConnected(true);
      },

      closed: (event: unknown): void => {
        console.log(
          "%c[WS]%c connection closed",
          logStyle("#ff4d4d"),
          dimStyle,
          event,
        );
        useConnectionStore.getState().setIsWsConnected(false);
      },

      error: (err: unknown): void => {
        console.error(
          "%c[WS]%c error occurred",
          logStyle("#ff4d4d"),
          "color: inherit;",
          err,
        );
        useConnectionStore.getState().setIsWsConnected(false);
      },

      message: (msg: unknown): void => {
        const wsMsg: WsMessage = msg as WsMessage;
        const type: string = wsMsg.type || "data";

        if (type === "next") {
          const nextMsg: WsNextMessage = wsMsg as unknown as WsNextMessage;
          const added = nextMsg.payload?.data?.messageAdded;
          if (added) {
            console.log(
              `%c[WS][messageAdded]%c Received: "${added.text}" | Seq: ${added.sequence}`,
              logStyle("#ffca28"),
              "color: inherit;",
            );
          }
        }

        console.groupCollapsed(
          "" + `%c[WS]%c message: ${type}`,
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
          myChats: {
            keyArgs: false,
            merge(
              existing: { chats: Reference[] } | undefined,
              incoming: { chats: Reference[] },
            ): { chats: Reference[] } {
              if (!existing) return incoming;
              return {
                ...incoming,
                chats: incoming.chats,
              };
            },
          },
          messageHistory: {
            keyArgs: ["chatId"],
            merge(
              existing: MessageConnection | undefined,
              incoming: MessageConnection,
              { readField }: FieldFunctionOptions,
            ): MessageConnection {
              const mergedMap: Map<string, Reference> = new Map();

              if (existing?.messages) {
                existing.messages.forEach((ref: Reference): void => {
                  const id: string | undefined = readField("id", ref) as
                    | string
                    | undefined;
                  if (id) mergedMap.set(id, ref);
                });
              }

              if (incoming.messages) {
                incoming.messages.forEach((ref: Reference): void => {
                  const id: string | undefined = readField("id", ref) as
                    | string
                    | undefined;
                  if (id) mergedMap.set(id, ref);
                });
              }

              const sortedMessages: Reference[] = Array.from(
                mergedMap.values(),
              ).sort((a: Reference, b: Reference): number => {
                const seqA: number = (readField("sequence", a) as number) || 0;
                const seqB: number = (readField("sequence", b) as number) || 0;
                return seqA - seqB;
              });

              console.log(
                `%c[CACHE][messageHistory]%c Merged ${sortedMessages.length} messages.`,
                logStyle("#9c27b0"),
                "color: inherit;",
              );

              return {
                ...incoming,
                messages: sortedMessages,
              };
            },
          },
        },
      },
      Chat: {
        keyFields: ["id"],
        fields: {
          unreadCount: {
            merge: (existing: number, incoming: number): number =>
              incoming !== undefined ? incoming : existing,
          },
        },
      },
      User: {
        keyFields: ["id"],
      },
      Message: {
        keyFields: ["id"],
      },
    },
  }),
});
