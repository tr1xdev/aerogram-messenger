import { GraphQLClient } from "graphql-request";
import { useAuthStore } from "@/store/auth-store";

const endpoint = import.meta.env.VITE_API_URL || "https://localhost:8080/query";

export const gqlClient = new GraphQLClient(endpoint, {
  headers: () => {
    const token = useAuthStore.getState().accessToken;
    return { Authorization: token ? `Bearer ${token}` : "" };
  },
});
