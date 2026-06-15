import { useCallback, useState } from "react";
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
import type {
  useMessageActionsJoinMutation,
  useMessageActionsJoinMutation$data,
} from "./__generated__/useMessageActionsJoinMutation.graphql";
import type { useMessageActionsDeleteMutation } from "./__generated__/useMessageActionsDeleteMutation.graphql";

const sendMessageMutation = graphql`
  mutation useMessageActionsSendMutation(
    $chatId: ID!
    $text: String!
    $replyToId: ID
    $attachments: [Upload!]
  ) {
    sendMessage(
      chatId: $chatId
      text: $text
      replyToId: $replyToId
      attachments: $attachments
    ) {
      ... on Message {
        id
        chatId
        text
        sentAt
        sequence
        isEdited
        attachments {
          id
          type
          url
          fileName
          fileSize
          contentType
        }
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

const joinChatMutation = graphql`
  mutation useMessageActionsJoinMutation($slug: String!) {
    joinChatBySlug(slug: $slug) {
      ... on Chat {
        id
        type
        title
        slug
      }
      ... on Error {
        message
      }
    }
  }
`;

const deleteMessageMutation = graphql`
  mutation useMessageActionsDeleteMutation($id: ID!) {
    deleteMessage(id: $id)
  }
`;

export function useMessageActions(chatId: string) {
  const [send, isSending] =
    useMutation<useMessageActionsSendMutation>(sendMessageMutation);
  const [edit] =
    useMutation<useMessageActionsEditMutation>(editMessageMutation);
  const [read] = useMutation<useMessageActionsReadMutation>(markAsReadMutation);
  const [join] = useMutation<useMessageActionsJoinMutation>(joinChatMutation);
  const [del] = useMutation<useMessageActionsDeleteMutation>(
    deleteMessageMutation,
  );

  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const sendMessage = useCallback(
    (
      text: string,
      files?: File[],
      replyToId: string | null = null,
      config?: Partial<UseMutationConfig<useMessageActionsSendMutation>>,
    ): Promise<void> => {
      return new Promise((resolve, reject): void => {
        if (!chatId) {
          reject(new Error("No chatId provided"));
          return;
        }

        const uploadables: Record<string, File> = {};
        if (files && files.length > 0) {
          files.forEach((file: File, index: number) => {
            uploadables[`attachments.${index}`] = file;
          });
        }

        send({
          ...config,
          variables: {
            chatId,
            text,
            replyToId,
            attachments: files ? new Array(files.length).fill(null) : [],
          },
          uploadables,
          updater: (store: RecordSourceSelectorProxy): void => {
            const payload: RecordProxy | null | undefined =
              store.getRootField("sendMessage");
            if (!payload || payload.getType() !== "Message") return;

            const chatRecord: RecordProxy | null | undefined =
              store.get(chatId);
            if (chatRecord) {
              const newSeq: number = Number(payload.getValue("sequence") ?? 0);
              const chatType: string = String(
                chatRecord.getValue("type") ?? "GROUP",
              );

              const beforeLastReadSeq: number = Number(
                chatRecord.getValue("lastReadSequence") ?? 0,
              );
              const beforeMyReadSeq: number = Number(
                chatRecord.getValue("myReadSequence") ?? 0,
              );

              const currentLastMsg: RecordProxy | null | undefined =
                chatRecord.getLinkedRecord("lastMessage");
              const currentSeq: number = currentLastMsg
                ? Number(currentLastMsg.getValue("sequence") ?? 0)
                : -1;

              if (newSeq >= currentSeq) {
                chatRecord.setLinkedRecord(payload, "lastMessage");
              }

              chatRecord.setValue(0, "unreadCount");
              chatRecord.setValue(newSeq, "myReadSequence");

              console.group(
                `[RELAY-MUTATION] sendMessage Done (Chat: ${chatId})`,
              );
              console.log(`Chat Type: ${chatType}`);
              console.table({
                "Message Sequence (new)": newSeq,
                "lastReadSequence (Before)": beforeLastReadSeq,
                "lastReadSequence (After)": Number(
                  chatRecord.getValue("lastReadSequence") ?? 0,
                ),
                "myReadSequence (Before)": beforeMyReadSeq,
                "myReadSequence (After)": newSeq,
              });
              console.groupEnd();

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
                const messageId: string = payload.getDataID();

                if (
                  !messages.some(
                    (m: RecordProxy): boolean => m.getDataID() === messageId,
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
        if (!id) {
          reject(new Error("No message id provided"));
          return;
        }

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
    if (!chatId) return;

    read({
      variables: { chatId },
      optimisticUpdater: (store: RecordSourceSelectorProxy): void => {
        const chatRecord: RecordProxy | null | undefined = store.get(chatId);
        if (chatRecord) {
          chatRecord.setValue(0, "unreadCount");
          const lastMsg: RecordProxy | null | undefined =
            chatRecord.getLinkedRecord("lastMessage");
          if (lastMsg) {
            const seq: number = Number(lastMsg.getValue("sequence") ?? 0);
            chatRecord.setValue(seq, "myReadSequence");
          }
        }
      },
    });
  }, [chatId, read]);

  const joinChat = useCallback(
    (slug: string): Promise<void> => {
      return new Promise((resolve, reject): void => {
        if (!slug) {
          reject(new Error("No slug provided"));
          return;
        }

        join({
          variables: { slug },
          onCompleted: (
            response: useMessageActionsJoinMutation$data,
            err: ReadonlyArray<PayloadError> | null,
          ): void => {
            if (err) {
              reject(err);
              return;
            }

            const result = response.joinChatBySlug;
            if (result && "message" in result && result.message) {
              reject(new Error(result.message as string));
              return;
            }

            resolve();
          },
          onError: (err: Error): void => reject(err),
        });
      });
    },
    [join],
  );

  const deleteMessage = useCallback(
    (id: string): Promise<void> => {
      if (!id) return Promise.reject(new Error("No message id provided"));
      if (deletingIds.has(id)) {
        return Promise.reject(new Error("Already deleting"));
      }

      setDeletingIds((prev) => new Set(prev).add(id));

      return new Promise((resolve, reject) => {
        del({
          variables: { id },
          updater: (store: RecordSourceSelectorProxy): void => {
            const root = store.getRoot();
            const messageRecord = store.get(id);
            if (!messageRecord) return;

            const chatIdFromMsg = messageRecord.getValue("chatId") as
              | string
              | undefined;
            if (chatIdFromMsg) {
              const history = root.getLinkedRecord("messageHistory", {
                chatId: chatIdFromMsg,
                limit: 50,
                beforeSequence: null,
              });
              if (history) {
                const messages = history.getLinkedRecords("messages") ?? [];
                history.setLinkedRecords(
                  messages.filter((m) => m.getDataID() !== id),
                  "messages",
                );
              }
            }
            store.delete(id);
          },
          onCompleted: (response, errors) => {
            setDeletingIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            if (errors && errors.length > 0) reject(errors);
            else resolve();
          },
          onError: (error) => {
            setDeletingIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            reject(error);
          },
        });
      });
    },
    [del, deletingIds],
  );

  const isDeleting = useCallback(
    (id: string) => deletingIds.has(id),
    [deletingIds],
  );

  return {
    sendMessage,
    editMessage,
    markAsRead,
    joinChat,
    isSending,
    deleteMessage,
    isDeleting,
  };
}
