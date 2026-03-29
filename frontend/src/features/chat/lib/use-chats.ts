import { useQuery } from "@apollo/client/react/index.js";
import { GET_MY_CHATS, GET_CHAT_DETAILS } from "../api";
import type { Chat } from "@/entities/chat/model/types";

export interface MyChatsResponse {
  myChats: {
    chats: Chat[];
    __typename?: string;
  };
}

export function useMyChats(): ReturnType<typeof useQuery<MyChatsResponse>> {
  return useQuery<MyChatsResponse>(GET_MY_CHATS);
}

export function useChatDetails(
  chatId: string,
): ReturnType<typeof useQuery<{ chat: Chat }>> {
  return useQuery<{ chat: Chat }>(GET_CHAT_DETAILS, {
    variables: { id: chatId },
    skip: !chatId,
    fetchPolicy: "cache-and-network",
  });
}
