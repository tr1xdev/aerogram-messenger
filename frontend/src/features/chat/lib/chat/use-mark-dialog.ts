import { useApolloClient, useMutation } from "@apollo/client/react";
import { useCallback, useRef } from "react";
import type { Chat, Message } from "@/entities/chat/model/types";
import { GET_MY_CHATS, MARK_DIALOG_AS_READ } from "@/features/chat/api";

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
) {
  const client = useApolloClient();
  const isPendingRef = useRef<boolean>(false);
  const [markDialog] = useMutation<MarkReadResponse>(MARK_DIALOG_AS_READ);

  const checkAndMarkRead = useCallback(async () => {
    if (
      document.visibilityState !== "visible" ||
      !me ||
      !chatId ||
      isPendingRef.current
    ) {
      return;
    }

    const hasUnread = messages.some(
      (m: Message) => m.sender.id !== me.id && !m.id.startsWith("temp-"),
    );

    if (!hasUnread && messages.length > 0) return;

    isPendingRef.current = true;

    try {
      await markDialog({
        variables: { chatId },
        onCompleted: (data: MarkReadResponse) => {
          if (!data.markDialogAsRead) return;

          const lastMessage = [...messages]
            .reverse()
            .find((m: Message) => typeof m.sequence === "number");
          const newSeq = lastMessage?.sequence || 0;

          client.cache.modify({
            id: client.cache.identify({ __typename: "Chat", id: chatId }),
            fields: {
              unreadCount: (): number => 0,
              lastReadSequence: (prev: number | undefined): number =>
                Math.max(prev || 0, newSeq),
            },
          });

          const sidebar = client.readQuery<MyChatsData>({
            query: GET_MY_CHATS,
          });

          if (sidebar?.myChats) {
            const updated = sidebar.myChats.chats.map(
              (c: Chat): Chat =>
                c.id === chatId
                  ? {
                      ...c,
                      unreadCount: 0,
                      lastReadSequence: Math.max(
                        c.lastReadSequence || 0,
                        newSeq,
                      ),
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
    } finally {
      isPendingRef.current = false;
    }
  }, [chatId, messages, me, markDialog, client]);

  return { checkAndMarkRead };
}
