import { useCallback } from "react";
import { graphql, useMutation } from "react-relay";
import type { UseMutationConfig } from "react-relay";
import type {
  RecordSourceSelectorProxy,
  RecordProxy,
  PayloadError,
} from "relay-runtime";
import type {
  useMessageActionsSendMutation,
  useMessageActionsSendMutation$data,
} from "./__generated__/useMessageActionsSendMutation.graphql";
import type {
  useMessageActionsEditMutation,
  useMessageActionsEditMutation$data,
} from "./__generated__/useMessageActionsEditMutation.graphql";
import type { useMessageActionsReadMutation } from "./__generated__/useMessageActionsReadMutation.graphql";

const sendMessageMutation = graphql`
  mutation useMessageActionsSendMutation(
    $chatId: ID!
    $text: String!
    $replyToId: ID
  ) {
    sendMessage(chatId: $chatId, text: $text, replyToId: $replyToId) {
      ... on Message {
        id
        chatId
        text
        sentAt
        sequence
        sender {
          id
          firstName
          lastName
          photoUrl
          displayName
        }
      }
    }
  }
`;

const editMessageMutation = graphql`
  mutation useMessageActionsEditMutation($id: ID!, $text: String!) {
    updateMessage(id: $id, text: $text) {
      ... on Message {
        id
        text
        isEdited
      }
    }
  }
`;

const markAsReadMutation = graphql`
  mutation useMessageActionsReadMutation($chatId: ID!) {
    markDialogAsRead(chatId: $chatId)
  }
`;

export function useMessageActions(chatId: string) {
  const [send, isSending] =
    useMutation<useMessageActionsSendMutation>(sendMessageMutation);
  const [edit] =
    useMutation<useMessageActionsEditMutation>(editMessageMutation);
  const [read] = useMutation<useMessageActionsReadMutation>(markAsReadMutation);

  const sendMessage = useCallback(
    (
      text: string,
      config?: Partial<UseMutationConfig<useMessageActionsSendMutation>>,
    ): Promise<void> => {
      return new Promise((resolve, reject): void => {
        send({
          ...config,
          variables: {
            chatId,
            text,
            replyToId: config?.variables?.replyToId ?? null,
          },
          updater: (store: RecordSourceSelectorProxy): void => {
            const payload: RecordProxy | null = store.getRootField(
              "sendMessage",
            ) as RecordProxy | null;
            const chatRecord: RecordProxy | null = store.get(
              chatId,
            ) as RecordProxy | null;
            const root: RecordProxy = store.getRoot();

            if (payload && chatRecord) {
              chatRecord.setLinkedRecord(payload, "lastMessage");
              chatRecord.setValue(0, "unreadCount");

              const seq: number = Number(payload.getValue("sequence")) || 0;
              chatRecord.setValue(seq, "myReadSequence");

              // ВНИМАНИЕ: Аргументы должны быть 1-в-1 как в useChatHistory
              const history: RecordProxy | null = root.getLinkedRecord(
                "messageHistory",
                {
                  chatId,
                  limit: 50, // Было count
                  beforeSequence: null, // Было cursor
                },
              ) as RecordProxy | null;

              if (history) {
                const messages: readonly RecordProxy[] =
                  (history.getLinkedRecords("messages") as
                    | readonly RecordProxy[]
                    | null) ?? [];

                const payloadId: string = payload.getDataID();
                const alreadyExists: boolean = messages.some(
                  (m: RecordProxy): boolean => m.getDataID() === payloadId,
                );

                if (!alreadyExists) {
                  history.setLinkedRecords([...messages, payload], "messages");
                }
              }
            }
          },
          onCompleted: (
            _response: useMessageActionsSendMutation$data,
            err: ReadonlyArray<PayloadError> | null,
          ): void => {
            if (err) reject(err);
            else resolve();
          },
          onError: (err: Error): void => reject(err),
        });
      });
    },
    [chatId, send],
  );

  const editMessage = useCallback(
    (id: string, text: string): Promise<void> => {
      return new Promise((resolve, reject): void => {
        edit({
          variables: { id, text },
          onCompleted: (
            _response: useMessageActionsEditMutation$data,
            err: ReadonlyArray<PayloadError> | null,
          ): void => {
            if (err) reject(err);
            else resolve();
          },
          onError: (err: Error): void => reject(err),
        });
      });
    },
    [edit],
  );

  const markAsRead = useCallback((): void => {
    read({ variables: { chatId } });
  }, [chatId, read]);

  return { sendMessage, editMessage, markAsRead, isSending };
}
