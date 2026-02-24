import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gqlClient } from "@/shared/api/client";
import { useAuthStore } from "@/store/auth";
import {
  GET_MY_CHATS,
  SEARCH_USERS,
  CREATE_DIRECT_CHAT,
  GET_MESSAGE_HISTORY,
  SEND_MESSAGE,
  MARK_AS_READ,
} from "@/features/chat/api/chat.gql";

export type ChatType = "PRIVATE" | "GROUP" | "CHANNEL";

export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name?: string;
  status: string;
}

export interface Message {
  id: string;
  chatId: string;
  text: string;
  sentAt: string;
  isRead: boolean;
  isEdited: boolean;
  sender: User;
}

export interface Chat {
  id: string;
  type: ChatType;
  title: string;
  unreadCount: number;
  lastMessage?: {
    id: string;
    text: string;
    sentAt: string;
    sender: {
      first_name: string;
    };
  };
}

export const useMessageHistory = (chatId: string, limit = 50, offset = 0) => {
  return useQuery({
    queryKey: ["messages", chatId, limit, offset],
    queryFn: async () => {
      const response = await gqlClient.request<{ messageHistory: Message[] }>(
        GET_MESSAGE_HISTORY,
        { chatId, limit, offset },
      );
      return response.messageHistory;
    },
    enabled: !!chatId,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: {
      chatId: string;
      text: string;
      replyToId?: string;
    }) => {
      const response = await gqlClient.request<{ sendMessage: Message }>(
        SEND_MESSAGE,
        variables,
      );
      return response.sendMessage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.chatId],
      });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: {
      chatID: string;
      lastMessageID: string;
    }) => {
      const response = await gqlClient.request<{ markAsRead: boolean }>(
        MARK_AS_READ,
        variables,
      );
      return response.markAsRead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

export const useMyChats = () => {
  const isAuth = useAuthStore((state) => state.isAuth);
  const token = localStorage.getItem("access_token");
  return useQuery({
    queryKey: ["chats", isAuth, token?.slice(-5)],
    queryFn: async () => {
      const response = await gqlClient.request<{ myChats: Chat[] }>(
        GET_MY_CHATS,
      );
      return response.myChats;
    },
    enabled: !!isAuth && !!token,
    retry: 1,
    staleTime: 30000,
  });
};

export const useSearchUsers = (username: string) => {
  return useQuery({
    queryKey: ["users", "search", username],
    queryFn: async () => {
      if (!username || username.length < 2) return [];
      const response = await gqlClient.request<{ searchUsers: User[] }>(
        SEARCH_USERS,
        { username },
      );
      return response.searchUsers;
    },
    enabled: username.length >= 2,
  });
};

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userID: string) => {
      const response = await gqlClient.request<{ createDirectChat: Chat }>(
        CREATE_DIRECT_CHAT,
        { userID },
      );
      return response.createDirectChat;
    },
    onSuccess: (newChat) => {
      queryClient.setQueryData(["chats", true], (old: Chat[] | undefined) => {
        return old ? [newChat, ...old] : [newChat];
      });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};
