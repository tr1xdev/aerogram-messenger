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
import { toast } from "sonner";
import { logger } from "@/shared/lib/logger";

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
let lastRateLimitTime: number = 0;
const THROTTLE_MS: number = 5000;

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
      logger.ws("Handshake established");
      useConnectionStore.getState().setIsWsConnected(true);
    },
    closed: (): void => {
      useConnectionStore.getState().setIsWsConnected(false);
    },
    error: (err: unknown): void => {
      logger.error("WS", "Connection error", err);
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
  const handleRateLimit = (): void => {
    const now: number = Date.now();
    if (now - lastRateLimitTime > THROTTLE_MS) {
      logger.error(
        "NETWORK",
        "Rate Limit Exceeded (429) - Throttling notifications",
      );
      toast.error("Rate limit exceeded. Please wait a moment.");
      lastRateLimitTime = now;
    }
  };

  const send = async (t: string | null): Promise<Response> => {
    const res: Response = await fetch(HTTP_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
      body: JSON.stringify({ query: params.text, variables }),
    });

    if (res.status === 429) {
      handleRateLimit();
      throw new Error("RATE_LIMIT_EXCEEDED");
    }

    return res;
  };

  const initialToken: string | null = useAuthStore.getState().accessToken;

  logger.relay(`Fetch: ${params.name}`, { variables });

  const response: Response = await send(initialToken);

  if (!response.ok) {
    const errorText: string = await response.text();
    logger.error("NETWORK", `HTTP ${response.status}: ${response.statusText}`, {
      errorText,
      operation: params.name,
    });
    throw new Error(`NETWORK_ERROR_${response.status}`);
  }

  const json: GraphQLResponse = (await response.json()) as GraphQLResponse;

  if (isUnauthorized(json)) {
    logger.auth("Unauthorized response detected, attempting refresh...");

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

          if (res.status === 429) {
            handleRateLimit();
            return null;
          }

          const refreshData: RefreshResponse =
            (await res.json()) as RefreshResponse;
          const tokens = refreshData.data?.refreshToken;

          if (tokens) {
            useAuthStore
              .getState()
              .setTokens(tokens.accessToken, tokens.refreshToken);
            logger.auth("Tokens refreshed successfully");
            return tokens.accessToken;
          }
          return null;
        } catch (e: unknown) {
          logger.error("AUTH", "Token refresh process failed", e);
          return null;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    const newToken: string | null = await refreshPromise;
    if (newToken) {
      logger.relay(`Retrying: ${params.name} with new token`);
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

    logger.ws(`Subscribing: ${operation.name}`, { variables });

    const unsubscribe: () => void = wsClient.subscribe(
      { query: operation.text, variables },
      {
        next: (data: unknown): void => {
          sink.next(data as GraphQLResponse);
        },
        error: (err: unknown): void => {
          logger.error("WS", `Subscription error in ${operation.name}`, err);
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
