import { useMemo, useCallback } from "react";
import { graphql, useLazyLoadQuery, useRefetchableFragment } from "react-relay";
import type { useMessagesQuery } from "./__generated__/useMessagesQuery.graphql";
import type { useMessages_history$key } from "./__generated__/useMessages_history.graphql";

const messagesQuery = graphql`
  query useMessagesQuery($chatId: ID!, $count: Int!, $cursor: Long) {
    ...useMessages_history
      @arguments(chatId: $chatId, count: $count, cursor: $cursor)
  }
`;

const messagesFragment = graphql`
  fragment useMessages_history on Query
  @refetchable(queryName: "useMessagesRefetchQuery")
  @argumentDefinitions(
    chatId: { type: "ID!" }
    count: { type: "Int", defaultValue: 50 }
    cursor: { type: "Long" }
  ) {
    messageHistory(chatId: $chatId, limit: $count, beforeSequence: $cursor) {
      __typename
      ... on MessageConnection {
        messages {
          id
          text
          sentAt
          sequence
          isEdited
          sender {
            id
            firstName
            photoUrl
            displayName
          }
          replyTo {
            id
            text
            sender {
              displayName
            }
          }
        }
        hasMore
      }
      ... on NotFoundError {
        message
      }
    }
  }
`;

export function useChatHistory(chatId: string) {
  const queryData = useLazyLoadQuery<useMessagesQuery>(
    messagesQuery,
    { chatId, count: 50 },
    { fetchPolicy: "store-and-network" },
  );

  const [data, refetch] = useRefetchableFragment<
    useMessagesQuery,
    useMessages_history$key
  >(messagesFragment, queryData);

  const history = data?.messageHistory;

  const messages = useMemo(() => {
    if (history?.__typename === "MessageConnection") {
      return [...(history.messages ?? [])].sort(
        (a, b) => Number(a.sequence) - Number(b.sequence),
      );
    }
    return [];
  }, [history]);

  const hasMore =
    history?.__typename === "MessageConnection" ? history.hasMore : false;

  const loadMore = useCallback(() => {
    if (!hasMore || !messages.length) return;

    const oldestSequence = messages[0].sequence;

    refetch(
      { chatId, count: 50, cursor: oldestSequence },
      { fetchPolicy: "network-only" },
    );
  }, [hasMore, messages, chatId, refetch]);

  return {
    messages,
    isLoading: !data,
    hasMore,
    loadMore,
    error: history?.__typename === "NotFoundError" ? history.message : null,
  };
}
