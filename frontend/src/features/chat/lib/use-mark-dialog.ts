import { useApolloClient, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useCallback, useRef } from "react";
import type { Chat, Message } from "@/entities/chat/model/types";
import { GET_MY_CHATS } from "../api";

const MARK_DIALOG_AS_READ = gql`
  mutation MarkDialogAsRead($chatId: String!, $lastSequence: Long!) {
    markDialogAsRead(chatId: $chatId, lastSequence: $lastSequence)
  }
`;

interface MyChatsData {
  myChats: {
    __typename: string;
    chats: Chat[];
  };
}

interface MarkReadResponse {
  markDialogAsRead: boolean;
}

export function useMarkDialog(
  chatId: string,
  messages: Message[],
  me?: { id: string },
  lastReadSequence?: number,
) {
  const client = useApolloClient();
  const lastMarkedSeqRef = useRef<number | null>(null);
  const [markDialog] = useMutation<MarkReadResponse>(MARK_DIALOG_AS_READ);

  const checkAndMarkRead = useCallback(() => {
    if (
      document.visibilityState !== "visible" ||
      !me ||
      !chatId ||
      !messages.length
    )
      return;

    const incoming = messages.filter(
      (m): m is Message & { sequence: number } =>
        typeof m.sequence === "number" &&
        m.sender.id !== me.id &&
        !m.id.startsWith("temp-"),
    );

    if (!incoming.length) return;

    const last = incoming[incoming.length - 1];
    const seq = last.sequence;

    if (
      (lastReadSequence !== undefined && seq <= lastReadSequence) ||
      lastMarkedSeqRef.current === seq
    )
      return;

    lastMarkedSeqRef.current = seq;

    markDialog({
      variables: { chatId: chatId, lastSequence: seq },
      onCompleted: (data: MarkReadResponse) => {
        if (!data.markDialogAsRead) return;

        client.cache.modify({
          id: client.cache.identify({ __typename: "Chat", id: chatId }),
          fields: {
            unreadCount: (): number => 0,
            lastReadSequence: (prev: number): number =>
              Math.max(prev || 0, seq),
          },
        });

        const sidebar = client.readQuery<MyChatsData>({
          query: GET_MY_CHATS,
        });

        if (sidebar?.myChats?.__typename === "ChatList") {
          const updated = sidebar.myChats.chats.map((c: Chat) =>
            c.id === chatId
              ? {
                  ...c,
                  unreadCount: 0,
                  lastReadSequence: Math.max(c.lastReadSequence || 0, seq),
                }
              : c,
          );
          client.writeQuery<MyChatsData>({
            query: GET_MY_CHATS,
            data: {
              myChats: {
                ...sidebar.myChats,
                chats: updated,
              },
            },
          });
        }
      },
    });
  }, [chatId, messages, me, lastReadSequence, markDialog, client]);

  return { checkAndMarkRead };
}
