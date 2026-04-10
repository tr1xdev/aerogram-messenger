import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { RelayEnvironmentProvider } from "react-relay";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RelayEnvironment from "@/app/api/relay-environment";
import App from "./App";
import "./index.css";

const queryClient: QueryClient = new QueryClient();

const rootElement: HTMLElement | null = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <RelayEnvironmentProvider environment={RelayEnvironment}>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div>Loading app...</div>}>
            <App />
          </Suspense>
        </QueryClientProvider>
      </RelayEnvironmentProvider>
    </React.StrictMode>,
  );
}
