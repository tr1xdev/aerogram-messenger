import { useQuery } from "@apollo/client/react/index.js";
import { useMemo } from "react";
import { GET_MESSAGE_HISTORY } from "../api";
import { useChatDetails } from "./use-chats";
import type { Message } from "@/entities/chat/model/types";

export interface ChatHistoryData {
  messageHistory: {
    messages: Message[];
    hasMore: boolean;
    __typename?: string;
  };
}

export function useChatHistory(chatId: string): {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  lastReadSequence?: number;
} {
  const { data, loading, error } = useQuery<ChatHistoryData>(
    GET_MESSAGE_HISTORY,
    {
      variables: { chatId, limit: 50, offset: 0 },
      skip: !chatId,
      fetchPolicy: "cache-and-network",
    },
  );

  const { data: chatDetails } = useChatDetails(chatId);

  if (error) {
    console.error("[Apollo Error] GET_MESSAGE_HISTORY:", error);
  }

  const messages: Message[] = useMemo((): Message[] => {
    const history = data?.messageHistory;
    if (!history || !("messages" in history)) return [];
    return [...history.messages].sort(
      (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0),
    );
  }, [data]);

  const hasMore: boolean = useMemo(
    (): boolean => data?.messageHistory?.hasMore ?? false,
    [data],
  );

  return {
    messages,
    isLoading: loading,
    hasMore,
    lastReadSequence: chatDetails?.chat?.lastReadSequence,
  };
}
