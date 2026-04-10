import {
  Environment,
  Network,
  RecordSource,
  Store,
  Observable,
  type RequestParameters,
  type Variables,
  type GraphQLResponse,
  type SubscribeFunction,
  type GraphQLSingularResponse,
} from "relay-runtime";
import { createClient, type Client } from "graphql-ws";
import { useConnectionStore } from "@/store/connection";
import { useAuthStore } from "@/store/auth-store";

interface RefreshResponse {
  data?: {
    refreshToken?: {
      accessToken: string;
      refreshToken: string;
      userId: string;
    };
  };
  errors?: ReadonlyArray<{ message: string }>;
}

const HTTP_ENDPOINT: string = "https://localhost:8080/query";
const WS_ENDPOINT: string = "wss://localhost:8080/query";

let refreshPromise: Promise<string | null> | null = null;

const log = {
  info: (namespace: string, message: string, data?: unknown): void => {
    console.log(
      `%c[${namespace}] %c${message}`,
      "color: #3b82f6; font-weight: bold",
      "color: inherit",
      data ?? "",
    );
  },
  warn: (namespace: string, message: string, data?: unknown): void => {
    console.warn(
      `%c[${namespace}] %c${message}`,
      "color: #f59e0b; font-weight: bold",
      "color: inherit",
      data ?? "",
    );
  },
  error: (namespace: string, message: string, data?: unknown): void => {
    console.error(
      `%c[${namespace}] %c${message}`,
      "color: #ef4444; font-weight: bold",
      "color: inherit",
      data ?? "",
    );
  },
  success: (namespace: string, message: string): void => {
    console.log(
      `%c[${namespace}] %c${message}`,
      "color: #10b981; font-weight: bold",
      "color: inherit",
    );
  },
};

const wsClient: Client = createClient({
  url: WS_ENDPOINT,
  lazy: true,
  shouldRetry: (): boolean => true,
  keepAlive: 10000,
  lazyCloseTimeout: 3600000,
  connectionParams: (): Record<string, string> => {
    const token: string | null = useAuthStore.getState().accessToken;
    log.info("Network:WS", "Providing connection params", {
      hasToken: !!token,
    });
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
  on: {
    connecting: (): void => log.info("Network:WS", "Connecting..."),
    opened: (): void => log.info("Network:WS", "Socket opened"),
    connected: (): void => {
      log.success("Network:WS", "Handshake established");
      useConnectionStore.getState().setIsWsConnected(true);
    },
    error: (err: unknown): void =>
      log.error("Network:WS", "Connection error", err),
    closed: (): void => {
      log.warn("Network:WS", "Connection closed");
      useConnectionStore.getState().setIsWsConnected(false);
    },
  },
});

(async (): Promise<void> => {
  log.info("System", "Bootstrapping environment...");
  try {
    const it: AsyncIterableIterator<unknown> = wsClient.iterate({
      query: "query { __typename }",
    });
    await it.next();
  } catch {
    log.info("Network:WS", "Initial probe finished");
  }
})();

function performRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const executeRefresh = async (): Promise<string | null> => {
    log.info(
      "Auth:Session",
      "Detected authorization failure. Rotating tokens...",
    );
    const store = useAuthStore.getState();
    const currentRefreshToken: string | null = store.refreshToken;

    if (!currentRefreshToken) {
      log.error("Auth:Session", "Abort: No refresh token available");
      store.logout();
      return null;
    }

    try {
      const response: Response = await fetch(HTTP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation RefreshToken($token: String!) {
              refreshToken(token: $token) {
                accessToken
                refreshToken
              }
            }
          `,
          variables: { token: currentRefreshToken },
        }),
      });

      const result: RefreshResponse =
        (await response.json()) as RefreshResponse;
      const data = result?.data?.refreshToken;

      if (data?.accessToken && data?.refreshToken) {
        log.success(
          "Auth:Session",
          "Rotation successful. Retrying pending operations.",
        );
        store.setTokens(data.accessToken, data.refreshToken);
        return data.accessToken;
      }

      log.error("Auth:Session", "Refresh failed. Clearing session.");
      store.logout();
      return null;
    } catch (err: unknown) {
      log.error("Auth:Session", "Critical network failure during refresh", err);
      return null;
    } finally {
      refreshPromise = null;
    }
  };

  refreshPromise = executeRefresh();
  return refreshPromise;
}

async function fetchRelay(
  params: RequestParameters,
  variables: Variables,
): Promise<GraphQLResponse> {
  const queryName: string = params.name;
  if (!params.text) throw new Error(`Missing query text for ${queryName}`);

  const sendRequest = async (tokenToUse: string | null): Promise<Response> => {
    return fetch(HTTP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
      },
      body: JSON.stringify({ query: params.text, variables }),
    });
  };

  const token: string | null = useAuthStore.getState().accessToken;
  let response: Response = await sendRequest(token);
  let json: GraphQLResponse = (await response.json()) as GraphQLResponse;

  const isUnauthorized = (payload: GraphQLResponse): boolean => {
    const checkSingular = (res: GraphQLSingularResponse): boolean => {
      if (typeof res !== "object" || res === null) return false;

      const hasAuthError =
        "errors" in res &&
        res.errors?.some(
          (e: { message: string }) =>
            e.message.toLowerCase().includes("unauthorized") ||
            e.message.toLowerCase().includes("forbidden"),
        );

      const hasForbiddenInterface =
        "data" in res &&
        res.data &&
        Object.values(res.data).some((val: unknown) => {
          if (typeof val === "object" && val !== null && "__typename" in val) {
            return val.__typename === "ForbiddenError";
          }
          return false;
        });

      return !!(hasAuthError || hasForbiddenInterface);
    };

    return Array.isArray(payload)
      ? payload.some(checkSingular)
      : checkSingular(payload as GraphQLSingularResponse);
  };

  if (isUnauthorized(json)) {
    log.warn(
      "Relay:Network",
      `Unauthorized/Forbidden in ${queryName}. Attempting recovery...`,
    );
    const newToken: string | null = await performRefreshToken();
    if (newToken) {
      response = await sendRequest(newToken);
      json = (await response.json()) as GraphQLResponse;
    }
  }

  return json;
}

const subscribe: SubscribeFunction = (
  operation: RequestParameters,
  variables: Variables,
): Observable<GraphQLResponse> => {
  return Observable.create((sink) => {
    if (!operation.text) return sink.error(new Error("No text"));
    log.info("Relay:WS", `Subscribe: ${operation.name}`);

    return wsClient.subscribe(
      { query: operation.text, variables },
      {
        next: (data: unknown): void => sink.next(data as GraphQLResponse),
        error: (err: unknown): void => {
          log.error("Relay:WS", `Stream error: ${operation.name}`, err);
          sink.error(err as Error);
        },
        complete: (): void => sink.complete(),
      },
    );
  });
};

const environment: Environment = new Environment({
  network: Network.create(fetchRelay, subscribe),
  store: new Store(new RecordSource()),
});

export default environment;
