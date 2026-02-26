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
import type { Chat, Message, User } from "@/entities/chat/model/types";

export const useMyChats = () => {
  const isAuth = useAuthStore((s) => s.isAuth);
  return useQuery({
    queryKey: ["chats", isAuth],
    queryFn: async () => {
      const response = await gqlClient.request<{ myChats: Chat[] }>(
        GET_MY_CHATS,
      );
      return response.myChats;
    },
    enabled: !!isAuth,
    staleTime: 30000,
  });
};

export const useMessageHistory = (chatId: string, limit = 50, offset = 0) =>
  useQuery({
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

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { chatId: string; text: string }) => {
      const res = await gqlClient.request<{ sendMessage: Message }>(
        SEND_MESSAGE,
        vars,
      );
      return res.sendMessage;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["messages", vars.chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { chatID: string; lastMessageID: string }) => {
      const res = await gqlClient.request<{ markAsRead: boolean }>(
        MARK_AS_READ,
        vars,
      );
      return res.markAsRead;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chats"] }),
  });
};

export const useSearchUsers = (username: string) =>
  useQuery({
    queryKey: ["users", username],
    queryFn: async () => {
      if (!username || username.length < 2) return [];
      const res = await gqlClient.request<{ searchUsers: User[] }>(
        SEARCH_USERS,
        { username },
      );
      return res.searchUsers;
    },
    enabled: username.length >= 2,
  });

export const useCreateChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userID: string) => {
      const res = await gqlClient.request<{ createDirectChat: Chat }>(
        CREATE_DIRECT_CHAT,
        { userID },
      );
      return res.createDirectChat;
    },
    onSuccess: (chat) => {
      queryClient.setQueryData(["chats", true], (old?: Chat[]) =>
        old ? [chat, ...old] : [chat],
      );
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};
