import { useQuery } from "@apollo/client/react/index.js";
import { GET_ME } from "../api";
import type { User } from "@/entities/chat/model/types";

export function useMe(): ReturnType<typeof useQuery<{ me: User }>> {
  return useQuery<{ me: User }>(GET_ME);
}
