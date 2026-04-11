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
      return res.errors.some((e: { message?: string }) =>
        e.message?.toLowerCase().includes("unauthorized"),
      );
    }
    return false;
  };

  if (Array.isArray(payload)) {
    return payload.some((item: GraphQLSingularResponse) => check(item));
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

  let response: Response = await send(token);
  let json: GraphQLResponse = (await response.json()) as GraphQLResponse;

  if (isUnauthorized(json) && !refreshPromise) {
    refreshPromise = (async (): Promise<string | null> => {
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
        log.success("Auth", "Tokens refreshed successfully");
        return tokens.accessToken;
      }
      return null;
    })();

    const newToken: string | null = await refreshPromise;
    refreshPromise = null;
    if (newToken) {
      response = await send(newToken);
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
    if (!operation.text) {
      sink.error(new Error("Operation text is missing"));
      return;
    }

    log.info("Network:WS", `Subscribing: ${operation.name}`, { variables });

    return wsClient.subscribe(
      { query: operation.text, variables },
      {
        next: (data: unknown): void => {
          log.success("Network:WS", `Update: ${operation.name}`, data);
          sink.next(data as GraphQLResponse);
        },
        error: (err: unknown): void => {
          log.error("Network:WS", `Error: ${operation.name}`, err);
          sink.error(err as Error);
        },
        complete: (): void => {
          log.info("Network:WS", `Completed: ${operation.name}`);
          sink.complete();
        },
      },
    );
  });
};

const environment: Environment = new Environment({
  network: Network.create(fetchRelay, subscribe),
  store: new Store(new RecordSource()),
});

export default environment;
