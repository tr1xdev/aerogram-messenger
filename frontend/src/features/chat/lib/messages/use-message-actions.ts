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
        isEdited
        sender {
          id
          firstName
          lastName
          photoUrl
          displayName
        }
        replyTo {
          id
          text
          sender {
            id
            firstName
            lastName
            displayName
          }
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
            const payload: RecordProxy | null | undefined =
              store.getRootField("sendMessage");
            if (!payload || payload.getType() !== "Message") return;

            const chatRecord: RecordProxy | null | undefined =
              store.get(chatId);
            if (chatRecord) {
              const seq: string = String(payload.getValue("sequence"));
              chatRecord.setLinkedRecord(payload, "lastMessage");
              chatRecord.setValue(0, "unreadCount");
              chatRecord.setValue(seq, "myReadSequence");

              const root: RecordProxy = store.getRoot();
              const history: RecordProxy | null | undefined =
                root.getLinkedRecord("messageHistory", {
                  chatId,
                  limit: 50,
                  beforeSequence: null,
                });

              if (history && history.getType() === "MessageConnection") {
                const messages: readonly RecordProxy[] =
                  (history.getLinkedRecords("messages") as
                    | readonly RecordProxy[]
                    | null) ?? [];
                if (
                  !messages.some(
                    (m: RecordProxy): boolean =>
                      m.getDataID() === payload.getDataID(),
                  )
                ) {
                  history.setLinkedRecords([...messages, payload], "messages");
                }
              }
            }
          },
          onCompleted: (
            _: useMessageActionsSendMutation$data,
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
            _: useMessageActionsEditMutation$data,
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
    read({
      variables: { chatId },
      optimisticUpdater: (store: RecordSourceSelectorProxy): void => {
        const chatRecord: RecordProxy | null | undefined = store.get(chatId);
        if (chatRecord) {
          chatRecord.setValue(0, "unreadCount");
          const lastMsg: RecordProxy | null | undefined =
            chatRecord.getLinkedRecord("lastMessage");
          if (lastMsg) {
            chatRecord.setValue(lastMsg.getValue("sequence"), "myReadSequence");
          }
        }
      },
    });
  }, [chatId, read]);

  return { sendMessage, editMessage, markAsRead, isSending };
}
