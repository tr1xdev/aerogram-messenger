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
} from "relay-runtime";
import { createClient } from "graphql-ws";

const wsClient = createClient({
  url: "wss://localhost:8080/query",
  lazy: false,
  on: {
    connecting: () => console.log("%c[WS] Connecting...", "color: #f59e0b"),
    opened: () => console.log("%c[WS] Socket Opened", "color: #10b981"),
    connected: () =>
      console.log("%c[WS] Connected", "color: #10b981; font-weight: bold"),
    error: (error: unknown) =>
      console.error("%c[WS] Connection Error:", "color: #ef4444", error),
    closed: () => console.warn("%c[WS] Closed", "color: #f59e0b"),
  },
});

async function fetchRelay(
  params: RequestParameters,
  variables: Variables,
): Promise<GraphQLResponse> {
  const queryText: string | null = params.text;

  console.log(
    `%c[Relay Fetch] %c${params.name}`,
    "color: #3b82f6; font-weight: bold",
    "color: #60a5fa",
    { variables },
  );

  if (queryText === null) {
    throw new Error(`Relay: operation ${params.name} text is null.`);
  }

  try {
    const response: Response = await fetch("https://localhost:8080/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: queryText,
        variables,
      }),
    });

    const raw: unknown = await response.json();
    const json: GraphQLResponse = raw as GraphQLResponse;

    if (json !== null && typeof json === "object" && "errors" in json) {
      console.error(
        `%c[Relay Fetch Error] %c${params.name}`,
        "color: #ef4444; font-weight: bold",
        "",
        json.errors,
      );
    } else {
      console.log(
        `%c[Relay Response] %c${params.name}`,
        "color: #10b981; font-weight: bold",
        "",
      );
    }

    return json;
  } catch (error: unknown) {
    console.error(
      `%c[Network Error] %c${params.name}`,
      "color: #ef4444; font-weight: bold",
      "",
      error,
    );
    throw error;
  }
}

const subscribe: SubscribeFunction = (
  operation: RequestParameters,
  variables: Variables,
): Observable<GraphQLResponse> => {
  return Observable.create((sink) => {
    const text: string | null = operation.text;

    if (!text) {
      return sink.error(new Error("Operation text is null"));
    }

    console.log(
      `%c[Relay Sub] %c${operation.name}`,
      "color: #a855f7; font-weight: bold",
      "color: #c084fc",
      { variables },
    );

    return wsClient.subscribe(
      {
        query: text,
        variables,
      },
      {
        next: (data: unknown) => {
          console.log(
            `%c[WS Data] %c${operation.name}`,
            "color: #10b981; font-weight: bold",
            "",
          );
          sink.next(data as GraphQLResponse);
        },
        error: (err: unknown) => {
          console.error(
            `%c[WS Error] %c${operation.name}`,
            "color: #ef4444; font-weight: bold",
            "",
            err,
          );
          sink.error(err as Error);
        },
        complete: () => {
          console.log(
            `%c[WS Complete] %c${operation.name}`,
            "color: #6b7280; font-weight: bold",
            "",
          );
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
