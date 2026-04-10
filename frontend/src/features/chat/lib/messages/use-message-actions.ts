import { useCallback } from "react";
import { graphql, useMutation } from "react-relay";
import type { UseMutationConfig } from "react-relay";
import type { RecordSourceSelectorProxy } from "relay-runtime";
import type {
  useMessageActionsSendMutation,
  useMessageActionsSendMutation$variables,
  useMessageActionsSendMutation$data,
} from "./__generated__/useMessageActionsSendMutation.graphql";
import type { useMessageActionsEditMutation } from "./__generated__/useMessageActionsEditMutation.graphql";
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
          photoUrl
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

export function useMessageActions(chatId: string): {
  sendMessage: (
    text: string,
    config?: Partial<UseMutationConfig<useMessageActionsSendMutation>>,
  ) => Promise<void>;
  editMessage: (id: string, text: string) => Promise<void>;
  markAsRead: () => void;
  isSending: boolean;
} {
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
        const variables: useMessageActionsSendMutation$variables = {
          chatId,
          text,
          replyToId: config?.variables?.replyToId ?? null,
        };

        send({
          ...config,
          variables,
          updater: (
            store: RecordSourceSelectorProxy<useMessageActionsSendMutation$data>,
            data: useMessageActionsSendMutation$data | null | undefined,
          ): void => {
            const payload = store.getRootField("sendMessage");
            if (!payload || payload.getType() !== "Message") return;

            const chatRecord = store.get(chatId);
            if (chatRecord) {
              chatRecord.setLinkedRecord(payload, "lastMessage");
              chatRecord.setValue(0, "unreadCount");
              chatRecord.setValue(
                payload.getValue("sequence"),
                "myReadSequence",
              );
            }

            if (config?.updater) {
              config.updater(store, data);
            }
          },
          onCompleted: (response, errors): void => {
            if (errors) reject(errors);
            else resolve();
            if (config?.onCompleted) config.onCompleted(response, errors);
          },
          onError: (error): void => {
            reject(error);
            if (config?.onError) config.onError(error);
          },
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
          optimisticResponse: {
            updateMessage: {
              id,
              text,
              isEdited: true,
            },
          },
          onCompleted: (_, errors): void => {
            if (errors) reject(errors);
            else resolve();
          },
          onError: (err): void => reject(err),
        });
      });
    },
    [edit],
  );

  const markAsRead = useCallback((): void => {
    read({
      variables: { chatId },
      optimisticResponse: {
        markDialogAsRead: true,
      },
      updater: (store: RecordSourceSelectorProxy): void => {
        const chatRecord = store.get(chatId);
        if (chatRecord) {
          chatRecord.setValue(0, "unreadCount");
          const lastMsg = chatRecord.getLinkedRecord("lastMessage");
          if (lastMsg) {
            chatRecord.setValue(lastMsg.getValue("sequence"), "myReadSequence");
          }
        }
      },
    });
  }, [chatId, read]);

  return { sendMessage, editMessage, markAsRead, isSending };
}
