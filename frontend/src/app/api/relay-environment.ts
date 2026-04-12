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
    };
  };
}

const HTTP_ENDPOINT: string = "https://localhost:8080/query";
const WS_ENDPOINT: string = "wss://localhost:8080/query";

let refreshPromise: Promise<string | null> | null = null;

const log = {
  info: (ns: string, msg: string, d?: unknown): void => {
    console.log(
      `%c[${ns}] %c${msg}`,
      "color: #3b82f6; font-weight: bold",
      "color: inherit",
      d ?? "",
    );
  },
  error: (ns: string, msg: string, d?: unknown): void => {
    console.error(
      `%c[${ns}] %c${msg}`,
      "color: #ef4444; font-weight: bold",
      "color: inherit",
      d ?? "",
    );
  },
  success: (ns: string, msg: string, d?: unknown): void => {
    console.log(
      `%c[${ns}] %c${msg}`,
      "color: #10b981; font-weight: bold",
      "color: inherit",
      d ?? "",
    );
  },
};

const wsClient: Client = createClient({
  url: WS_ENDPOINT,
  lazy: true,
  shouldRetry: (): boolean => true,
  connectionParams: (): Record<string, string> => {
    const token: string | null = useAuthStore.getState().accessToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
  on: {
    connected: (): void => {
      log.success("Network:WS", "Handshake established");
      useConnectionStore.getState().setIsWsConnected(true);
    },
    closed: (): void => {
      useConnectionStore.getState().setIsWsConnected(false);
    },
    error: (err: unknown): void => {
      log.error("Network:WS", "Connection error", err);
    },
  },
});

function isUnauthorized(payload: GraphQLResponse): boolean {
  const check = (res: GraphQLSingularResponse): boolean => {
    if (
      typeof res === "object" &&
      res !== null &&
      "errors" in res &&
      Array.isArray(res.errors)
    ) {
      return res.errors.some(
        (e: { message?: string }): boolean =>
          e.message?.toLowerCase().includes("unauthorized") ?? false,
      );
    }
    return false;
  };

  if (Array.isArray(payload)) {
    return payload.some((item: GraphQLSingularResponse): boolean =>
      check(item),
    );
  }
  return check(payload as GraphQLSingularResponse);
}

async function fetchRelay(
  params: RequestParameters,
  variables: Variables,
): Promise<GraphQLResponse> {
  const token: string | null = useAuthStore.getState().accessToken;

  const send = async (t: string | null): Promise<Response> => {
    return fetch(HTTP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      body: JSON.stringify({ query: params.text, variables }),
    });
  };

  const response: Response = await send(token);

  if (response.status === 429) {
    log.error("Network", "HTTP 429: Too Many Requests. Stopping retry cycle.");
    throw new Error("RATE_LIMIT_EXCEEDED");
  }

  const json: GraphQLResponse = (await response.json()) as GraphQLResponse;

  if (isUnauthorized(json)) {
    if (!refreshPromise) {
      refreshPromise = (async (): Promise<string | null> => {
        try {
          const rt: string | null = useAuthStore.getState().refreshToken;
          if (!rt) return null;

          const res: Response = await fetch(HTTP_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `mutation { refreshToken(token: "${rt}") { accessToken refreshToken } }`,
            }),
          });

          const refreshData: RefreshResponse =
            (await res.json()) as RefreshResponse;
          const tokens = refreshData.data?.refreshToken;

          if (tokens) {
            useAuthStore
              .getState()
              .setTokens(tokens.accessToken, tokens.refreshToken);
            log.success("Auth", "Tokens refreshed");
            return tokens.accessToken;
          }
          return null;
        } catch (e: unknown) {
          log.error("Auth", "Refresh failed", e);
          return null;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    const newToken: string | null = await refreshPromise;
    if (newToken) {
      const retryResponse: Response = await send(newToken);
      return (await retryResponse.json()) as GraphQLResponse;
    }
  }

  return json;
}

const subscribe: SubscribeFunction = (
  operation: RequestParameters,
  variables: Variables,
): Observable<GraphQLResponse> => {
  return Observable.create((sink): (() => void) => {
    if (!operation.text) {
      sink.error(new Error("Operation text is missing"));
      return (): void => {};
    }

    log.info("Network:WS", `Subscribing: ${operation.name}`, { variables });

    const unsubscribe: () => void = wsClient.subscribe(
      { query: operation.text, variables },
      {
        next: (data: unknown): void => {
          sink.next(data as GraphQLResponse);
        },
        error: (err: unknown): void => {
          log.error("Network:WS", `Error in ${operation.name}`, err);
          sink.error(err as Error);
        },
        complete: (): void => {
          sink.complete();
        },
      },
    );

    return unsubscribe;
  });
};

const environment: Environment = new Environment({
  network: Network.create(fetchRelay, subscribe),
  store: new Store(new RecordSource()),
});

export default environment;
