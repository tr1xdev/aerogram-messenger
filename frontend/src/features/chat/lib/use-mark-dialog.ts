import { useApolloClient, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import type { Chat, Message } from "@/entities/chat/model/types";
import { GET_MY_CHATS } from "../api/chat.gql";

const MARK_DIALOG_AS_READ = gql`
  mutation MarkDialogAsRead($chatID: String!, $lastSequence: Long!) {
    markDialogAsRead(chatID: $chatID, lastSequence: $lastSequence)
  }
`;

export function useMarkDialog(myId?: string) {
  const client = useApolloClient();
  const [markDialog] = useMutation(MARK_DIALOG_AS_READ);

  function markChatAsRead(chatId: string, messages: Message[]) {
    if (!myId || !messages.length) return;

    const valid = messages.filter(
      (m): m is Message & { sequence: number } =>
        typeof m.sequence === "number" && m.sender.id !== myId,
    );

    if (!valid.length) return;

    const lastSequence = Math.max(...valid.map((m) => m.sequence));

    markDialog({
      variables: { chatID: chatId, lastSequence },
      onCompleted: () => {
        client.cache.modify({
          id: client.cache.identify({ __typename: "Chat", id: chatId }),
          fields: {
            unreadCount: () => 0,
          },
        });

        const sidebar = client.readQuery<{ myChats: Chat[] }>({
          query: GET_MY_CHATS,
        });
        if (sidebar) {
          const updated = sidebar.myChats.map((c) =>
            c.id === chatId ? { ...c, unreadCount: 0 } : c,
          );
          client.writeQuery({
            query: GET_MY_CHATS,
            data: { myChats: updated },
          });
        }
      },
    });
  }

  return { markChatAsRead };
}
