import { useQuery } from "@apollo/client/react/index.js";
import {
  CombinedGraphQLErrors,
  ServerError,
} from "@apollo/client/errors/index.js";
import { useMemo } from "react";
import { GET_MESSAGE_HISTORY } from "@/features/chat/api";
import { useChatDetails } from "@/features/chat/lib";
import type { Message, Chat } from "@/entities/chat/model/types";
import type { GraphQLFormattedError } from "graphql";

export interface ChatHistoryData {
  messageHistory: {
    messages: Message[];
    hasMore: boolean;
    __typename?: string;
  };
}

export interface ChatHistoryVariables {
  chatId: string;
  limit: number;
  offset: number;
}

interface ChatHistoryHookResult {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  lastReadSequence: number | undefined;
}

export function useChatHistory(chatId: string): ChatHistoryHookResult {
  const {
    data,
    loading,
    error,
  }: {
    data?: ChatHistoryData;
    loading: boolean;
    error?: Error;
  } = useQuery<ChatHistoryData, ChatHistoryVariables>(GET_MESSAGE_HISTORY, {
    variables: { chatId, limit: 50, offset: 0 },
    skip: !chatId,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const chatDetails: { data?: { chat?: Chat } } = useChatDetails(chatId);

  if (error) {
    if (CombinedGraphQLErrors.is(error)) {
      error.errors.forEach((graphQLError: GraphQLFormattedError): void => {
        console.error(
          `[useChatHistory] GraphQL Error: ${graphQLError.message}`,
        );
      });
    } else if (ServerError.is(error)) {
      console.error(
        `[useChatHistory] Server Error: ${error.message}`,
        `Status: ${error.statusCode}`,
      );
    } else {
      console.error(`[useChatHistory] General Error: ${error.message}`);
    }
  }

  const messages: Message[] = useMemo((): Message[] => {
    const history: ChatHistoryData["messageHistory"] | undefined =
      data?.messageHistory;
    if (!history?.messages) return [];

    console.log(
      `[useChatHistory] Processing messages for ${chatId}, count: ${history.messages.length}`,
    );

    return [...history.messages].sort(
      (a: Message, b: Message): number => (a.sequence ?? 0) - (b.sequence ?? 0),
    );
  }, [data, chatId]);

  const hasMore: boolean = useMemo(
    (): boolean => data?.messageHistory?.hasMore ?? false,
    [data],
  );

  return {
    messages,
    isLoading: loading,
    hasMore,
    lastReadSequence: chatDetails.data?.chat?.lastReadSequence,
  };
}
