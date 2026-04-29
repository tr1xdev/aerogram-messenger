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
  type UploadableMap,
  type PayloadError,
} from "relay-runtime";
import { createClient, type Client } from "graphql-ws";
import { useAuthStore } from "@/store/auth-store";
import { useConnectionStore } from "@/store/connection";
import { toast } from "sonner";
import { logger } from "@/shared/lib/logger";

interface ExtendedRecordSource extends RecordSource {
  getLinkedRecordIDs(
    dataID: string,
    storageKey: string,
  ): (string | null)[] | null | undefined;
}

interface RefreshTokenResponse {
  data?: {
    refreshToken?: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

const HTTP_ENDPOINT: string =
  import.meta.env.VITE_API_URL || "https://localhost:8080/query";
const WS_ENDPOINT: string =
  import.meta.env.VITE_WS_URL || "wss://localhost:8080/query";
const THROTTLE_MS: number = 5000;

const inFlightRequests: Map<string, Promise<GraphQLResponse>> = new Map();

let refreshPromise: Promise<string | null> | null = null;
let lastRateLimitNotification: number = 0;
let lastServerErrorNotification: number = 0;

const getAuthHeaders = (token: string | null): Record<string, string> => {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
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
      return res.errors.some((err: PayloadError): boolean => {
        const msg: string = err.message.toLowerCase();
        return (
          msg.includes("unauthorized") ||
          msg.includes("session expired") ||
          msg.includes("session terminated") ||
          msg.includes("not found")
        );
      });
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
  uploadables?: UploadableMap | null,
): Promise<GraphQLResponse> {
  const headers: Record<string, string> = getAuthHeaders(token);
  let body: BodyInit;

  if (uploadables) {
    const formData: FormData = new FormData();
    formData.append(
      "operations",
      JSON.stringify({ query: params.text, variables }),
    );
    const map: Record<string, string[]> = {};
    Object.keys(uploadables).forEach((key: string): void => {
      map[key] = [`variables.${key}`];
    });
    formData.append("map", JSON.stringify(map));
    Object.entries(uploadables).forEach(([key, value]): void => {
      formData.append(key, value);
    });
    body = formData;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({ query: params.text, variables });
  }

  const response: Response = await fetch(HTTP_ENDPOINT, {
    method: "POST",
    headers,
    body,
  });

  if (response.status === 429) {
    const now: number = Date.now();
    if (now - lastRateLimitNotification > THROTTLE_MS) {
      toast.error("Rate limit exceeded");
      lastRateLimitNotification = now;
    }
    throw new Error("RATE_LIMIT");
  }

  if (response.status >= 500) {
    const now: number = Date.now();
    if (now - lastServerErrorNotification > THROTTLE_MS) {
      toast.error(`Server error (${response.status})`);
      lastServerErrorNotification = now;
    }
    throw new Error(`SERVER_ERROR_${response.status}`);
  }

  if (!response.ok) throw new Error(`NETWORK_ERROR_${response.status}`);

  return (await response.json()) as GraphQLResponse;
}

async function executeRefresh(): Promise<string | null> {
  try {
    const rt: string | null = useAuthStore.getState().refreshToken;
    if (!rt) return null;

    const res: Response = await fetch(HTTP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `mutation RefreshToken($token: String!) { refreshToken(token: $token) { accessToken refreshToken } }`,
        variables: { token: rt },
      }),
    });

    const json: RefreshTokenResponse =
      (await res.json()) as RefreshTokenResponse;
    const tokens = json.data?.refreshToken;

    if (tokens && tokens.accessToken && tokens.refreshToken) {
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
  _cacheConfig: unknown,
  uploadables?: UploadableMap | null,
): Promise<GraphQLResponse> {
  const cacheKey: string = `${params.id ?? params.text}-${JSON.stringify(variables)}`;
  const setIsUpdating: (val: boolean) => void =
    useConnectionStore.getState().setIsUpdating;
  const isQuery: boolean = params.operationKind === "query";

  const pending: Promise<GraphQLResponse> | undefined =
    inFlightRequests.get(cacheKey);
  if (pending && !uploadables) return pending;

  let updateTimer: ReturnType<typeof setTimeout> | null = null;
  if (isQuery) {
    updateTimer = setTimeout((): void => {
      setIsUpdating(true);
    }, 1000);
  }

  const runExecution = async (): Promise<GraphQLResponse> => {
    try {
      const token: string | null = useAuthStore.getState().accessToken;
      let json: GraphQLResponse = await performFetch(
        params,
        variables,
        token,
        uploadables,
      );

      if (hasUnauthorizedError(json)) {
        if (!refreshPromise) refreshPromise = executeRefresh();
        const newToken: string | null = await refreshPromise;
        if (newToken) {
          json = await performFetch(params, variables, newToken, uploadables);
        } else {
          useAuthStore.getState().logout();
          localStorage.removeItem("recent_searches");
          window.location.href = "/sign-in";
        }
      }
      return json;
    } catch (err: unknown) {
      const errorMessage: string =
        err instanceof Error ? err.message : "Unknown error";
      return {
        data: null,
        errors: [{ message: errorMessage } as PayloadError],
      } as unknown as GraphQLResponse;
    } finally {
      if (updateTimer) clearTimeout(updateTimer);
      if (isQuery) Promise.resolve().then((): void => setIsUpdating(false));
      inFlightRequests.delete(cacheKey);
    }
  };

  const executionPromise: Promise<GraphQLResponse> = runExecution();
  if (!uploadables) inFlightRequests.set(cacheKey, executionPromise);
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
    return wsClient.subscribe(
      { query: operation.text, variables },
      {
        next: (data: unknown): void => sink.next(data as GraphQLResponse),
        error: (err: unknown): void =>
          sink.error(err instanceof Error ? err : new Error(String(err))),
        complete: (): void => sink.complete(),
      },
    );
  });
};

function createStore(): Store {
  const source: RecordSource = new RecordSource();
  const store: Store = new Store(source, { gcReleaseBufferSize: 10 });
  const recordSource: ExtendedRecordSource =
    store.getSource() as unknown as ExtendedRecordSource;

  if (typeof recordSource.getLinkedRecordIDs === "function") {
    const originalGetLinkedRecordIDs =
      recordSource.getLinkedRecordIDs.bind(recordSource);

    recordSource.getLinkedRecordIDs = (
      dataID: string,
      storageKey: string,
    ): (string | null)[] | null | undefined => {
      const result = originalGetLinkedRecordIDs(dataID, storageKey);

      if (!result || !Array.isArray(result)) return result;

      return result.filter((id: string | null): boolean => {
        if (id === null) return false;
        const record = recordSource.get(id);
        return record !== undefined && record !== null;
      });
    };
  }

  return store;
}

export const environment: Environment = new Environment({
  network: Network.create(fetchRelay, subscribe),
  store: createStore(),
});

export default environment;
