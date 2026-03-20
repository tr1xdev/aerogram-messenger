import { GraphQLClient } from "graphql-request";

const endpoint = import.meta.env.VITE_API_URL || "https://localhost:8080/query";

export const gqlClient = new GraphQLClient(endpoint, {
  headers: () => {
    const token = localStorage.getItem("access_token");
    const headers: Record<string, string> = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  },
});
