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
import { useAuthStore } from "@/store/auth-store";
import { useConnectionStore } from "@/store/connection";
import { toast } from "sonner";
import { logger } from "@/shared/lib/logger";

const HTTP_ENDPOINT: string =
  import.meta.env.VITE_API_URL || "https://localhost:8080/query";
const WS_ENDPOINT: string =
  import.meta.env.VITE_WS_URL || "wss://localhost:8080/query";
const THROTTLE_MS: number = 5000;

const inFlightRequests: Map<string, Promise<GraphQLResponse>> = new Map();

let refreshPromise: Promise<string | null> | null = null;
let lastRateLimitNotification: number = 0;

const getAuthHeaders = (token: string | null): Record<string, string> => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

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
      Promise.resolve().then((): void => {
        useConnectionStore.getState().setIsWsConnected(true);
      });
    },
    closed: (): void => {
      Promise.resolve().then((): void => {
        useConnectionStore.getState().setIsWsConnected(false);
      });
    },
    error: (err: unknown): void => logger.error("WS", "Connection error", err),
  },
});

function hasUnauthorizedError(response: GraphQLResponse): boolean {
  const check = (res: GraphQLSingularResponse): boolean => {
    if (
      typeof res === "object" &&
      res !== null &&
      "errors" in res &&
      Array.isArray(res.errors)
    ) {
      return res.errors.some(
        (err: { message?: string }): boolean =>
          err.message?.toLowerCase().includes("unauthorized") ?? false,
      );
    }
    return false;
  };

  if (Array.isArray(response)) {
    return response.some((item: GraphQLSingularResponse): boolean =>
      check(item),
    );
  }
  return check(response as GraphQLSingularResponse);
}

async function performFetch(
  params: RequestParameters,
  variables: Variables,
  token: string | null,
): Promise<GraphQLResponse> {
  const response: Response = await fetch(HTTP_ENDPOINT, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      query: params.text,
      variables,
    }),
  });

  if (response.status === 429) {
    const now: number = Date.now();
    if (now - lastRateLimitNotification > THROTTLE_MS) {
      toast.error("Rate limit exceeded. Slow down a bit.");
      lastRateLimitNotification = now;
    }
    throw new Error("RATE_LIMIT");
  }

  if (!response.ok) {
    throw new Error(`SERVER_ERROR_${response.status}`);
  }

  return response.json() as Promise<GraphQLResponse>;
}

async function executeRefresh(): Promise<string | null> {
  try {
    const rt: string | null = useAuthStore.getState().refreshToken;
    if (!rt) return null;

    const res: Response = await fetch(HTTP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `mutation RefreshToken($token: String!) {
          refreshToken(token: $token) { accessToken refreshToken }
        }`,
        variables: { token: rt },
      }),
    });

    const json: {
      data?: { refreshToken?: { accessToken: string; refreshToken: string } };
    } = await res.json();
    const tokens = json.data?.refreshToken;

    if (tokens) {
      useAuthStore
        .getState()
        .setTokens(tokens.accessToken, tokens.refreshToken);
      return tokens.accessToken;
    }
    return null;
  } catch (err: unknown) {
    logger.error("AUTH", "Refresh failed", err);
    return null;
  } finally {
    refreshPromise = null;
  }
}

async function fetchRelay(
  params: RequestParameters,
  variables: Variables,
): Promise<GraphQLResponse> {
  const cacheKey: string = `${params.id ?? params.text}-${JSON.stringify(variables)}`;
  const setIsUpdating = useConnectionStore.getState().setIsUpdating;
  const isQuery: boolean = params.operationKind === "query";

  const pending: Promise<GraphQLResponse> | undefined =
    inFlightRequests.get(cacheKey);
  if (pending) {
    logger.relay(`Deduplicated: ${params.name}`);
    return pending;
  }

  if (isQuery) {
    Promise.resolve().then((): void => {
      setIsUpdating(true);
    });
  }

  const runExecution = async (): Promise<GraphQLResponse> => {
    try {
      const token: string | null = useAuthStore.getState().accessToken;
      logger.relay(`Fetch: ${params.name}`);

      let json: GraphQLResponse = await performFetch(params, variables, token);

      if (hasUnauthorizedError(json)) {
        if (!refreshPromise) {
          refreshPromise = executeRefresh();
        }

        const newToken: string | null = await refreshPromise;
        if (newToken) {
          logger.auth(`Retrying ${params.name} with new token`);
          json = await performFetch(params, variables, newToken);
        }
      }

      return json;
    } finally {
      if (isQuery) {
        Promise.resolve().then((): void => {
          setIsUpdating(false);
        });
      }

      const current: Promise<GraphQLResponse> | undefined =
        inFlightRequests.get(cacheKey);
      if (current === executionPromise) {
        inFlightRequests.delete(cacheKey);
      }
    }
  };

  const executionPromise: Promise<GraphQLResponse> = runExecution();
  inFlightRequests.set(cacheKey, executionPromise);

  return executionPromise;
}

const subscribe: SubscribeFunction = (
  operation: RequestParameters,
  variables: Variables,
): Observable<GraphQLResponse> => {
  return Observable.create((sink): (() => void) => {
    if (!operation.text) {
      sink.error(new Error("No query text"));
      return (): void => {};
    }

    logger.ws(`Subscribing: ${operation.name}`);

    return wsClient.subscribe(
      { query: operation.text, variables },
      {
        next: (data: unknown): void => sink.next(data as GraphQLResponse),
        error: (err: unknown): void => {
          logger.error("WS", `Sub Error: ${operation.name}`, err);
          sink.error(err as Error);
        },
        complete: (): void => sink.complete(),
      },
    );
  });
};

export const environment: Environment = new Environment({
  network: Network.create(fetchRelay, subscribe),
  store: new Store(new RecordSource(), {
    gcReleaseBufferSize: 10,
  }),
});

export default environment;
