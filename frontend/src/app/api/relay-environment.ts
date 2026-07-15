import {
  Environment,
  Network,
  RecordSource,
  Store,
  Observable,
  type MutableRecordSource,
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

interface RefreshTokenResponse {
  data?: {
    refreshToken?: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

type RecordSourceWithLinkedIDs = MutableRecordSource & {
  getLinkedRecordIDs?: (
    dataID: string,
    storageKey: string,
  ) => (string | null)[] | null | undefined;
};

const HTTP_ENDPOINT: string =
  import.meta.env.VITE_API_URL || "http://localhost:3443/query";
const WS_ENDPOINT: string =
  import.meta.env.VITE_WS_URL || "ws://localhost:3443/query";
const THROTTLE_MS: number = 5000;

const LOG_STYLES: Record<string, string> = {
  query:
    "color: #00ff00; font-weight: bold; background: #002200; padding: 2px 5px; border-radius: 3px;",
  mutation:
    "color: #ffaa00; font-weight: bold; background: #221100; padding: 2px 5px; border-radius: 3px;",
  subscription:
    "color: #00d4ff; font-weight: bold; background: #001122; padding: 2px 5px; border-radius: 3px;",
  error:
    "color: #ff4444; font-weight: bold; background: #220000; padding: 2px 5px; border-radius: 3px;",
  success:
    "color: #ffffff; font-weight: bold; background: #004400; padding: 2px 5px; border-radius: 3px;",
  info: "color: #888888; font-style: italic;",
};

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
      console.log(
        "%c WS %c Handshake established ",
        LOG_STYLES.subscription,
        LOG_STYLES.info,
      );
      Promise.resolve().then((): void => {
        useConnectionStore.getState().setIsWsConnected(true);
      });
    },
    closed: (): void => {
      console.log(
        "%c WS %c Connection closed ",
        LOG_STYLES.subscription,
        LOG_STYLES.info,
      );
      Promise.resolve().then((): void => {
        useConnectionStore.getState().setIsWsConnected(false);
      });
    },
    error: (err: unknown): void => {
      console.error("%c WS ERROR %c", LOG_STYLES.error, "", err);
      logger.error("WS", "Connection error", err);
    },
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
  const startTime: number = performance.now();
  const type: string = params.operationKind;
  const style: string = LOG_STYLES[type] || LOG_STYLES.info;

  console.groupCollapsed(
    `%c ${type.toUpperCase()} %c ${params.name} `,
    style,
    "color: white; font-weight: normal;",
  );
  console.log("%c Variables: ", LOG_STYLES.info, variables);

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

  try {
    const response: Response = await fetch(HTTP_ENDPOINT, {
      method: "POST",
      headers,
      body,
    });

    const duration: string = (performance.now() - startTime).toFixed(2);

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

    const json: GraphQLResponse = (await response.json()) as GraphQLResponse;

    if (!Array.isArray(json)) {
      if ("errors" in json && json.errors && json.errors.length > 0) {
        console.log(
          `%c FAILED %c ${duration}ms `,
          LOG_STYLES.error,
          LOG_STYLES.info,
        );
        console.log("%c Errors: ", LOG_STYLES.error, json.errors);
      } else if ("data" in json) {
        console.log(
          `%c SUCCESS %c ${duration}ms `,
          LOG_STYLES.success,
          LOG_STYLES.info,
        );
        console.log("%c Payload: ", LOG_STYLES.info, json.data);
      }
    } else {
      console.log(
        `%c BATCH SUCCESS %c ${duration}ms `,
        LOG_STYLES.success,
        LOG_STYLES.info,
      );
    }

    console.groupEnd();
    return json;
  } catch (error: unknown) {
    console.log(`%c CRASHED %c`, LOG_STYLES.error, LOG_STYLES.info);
    console.groupEnd();
    throw error;
  }
}

async function executeRefresh(): Promise<string | null> {
  console.log(
    "%c AUTH %c Refreshing session... ",
    LOG_STYLES.mutation,
    LOG_STYLES.info,
  );
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
      console.log(
        "%c AUTH %c Session renewed ",
        LOG_STYLES.success,
        LOG_STYLES.info,
      );
      return tokens.accessToken;
    }
    return null;
  } catch (err: unknown) {
    console.error("%c AUTH ERROR %c", LOG_STYLES.error, "", err);
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
  if (pending && !uploadables) {
    console.log(
      `%c CACHE %c Deduplicating request: ${params.name}`,
      LOG_STYLES.info,
      "",
    );
    return pending;
  }

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
        console.warn(
          `%c AUTH %c Unauthorized detected in ${params.name}, retrying...`,
          LOG_STYLES.mutation,
          LOG_STYLES.info,
        );
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

    console.log(
      `%c SUB START %c ${operation.name}`,
      LOG_STYLES.subscription,
      LOG_STYLES.info,
    );

    return wsClient.subscribe(
      { query: operation.text, variables },
      {
        next: (data: unknown): void => {
          console.log(
            `%c SUB DATA %c ${operation.name}`,
            LOG_STYLES.subscription,
            LOG_STYLES.info,
            data,
          );
          sink.next(data as GraphQLResponse);
        },
        error: (err: unknown): void => {
          console.error(
            `%c SUB ERROR %c ${operation.name}`,
            LOG_STYLES.error,
            "",
            err,
          );
          sink.error(err instanceof Error ? err : new Error(String(err)));
        },
        complete: (): void => {
          console.log(
            `%c SUB COMPLETE %c ${operation.name}`,
            LOG_STYLES.subscription,
            LOG_STYLES.info,
          );
          sink.complete();
        },
      },
    );
  });
};

function createStore(): Store {
  const source: RecordSource = new RecordSource();
  const store: Store = new Store(source, { gcReleaseBufferSize: 10 });
  const recordSource: RecordSourceWithLinkedIDs =
    store.getSource() as RecordSourceWithLinkedIDs;

  if (typeof recordSource.getLinkedRecordIDs === "function") {
    const originalGetLinkedRecordIDs: (
      dataID: string,
      storageKey: string,
    ) => (string | null)[] | null | undefined =
      recordSource.getLinkedRecordIDs.bind(recordSource);

    recordSource.getLinkedRecordIDs = (
      dataID: string,
      storageKey: string,
    ): (string | null)[] | null | undefined => {
      const result: (string | null)[] | null | undefined =
        originalGetLinkedRecordIDs(dataID, storageKey);

      if (!result || !Array.isArray(result)) return result;

      return result.filter((id: string | null): boolean => {
        if (id === null) return false;
        const record: unknown = recordSource.get(id);
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
