import { useMutation } from "@apollo/client/react/index.js";
import { type ApolloCache, type Reference } from "@apollo/client/index.js";
import { type ModifierDetails } from "@apollo/client/cache/index.js";

import {
  SEND_MESSAGE,
  EDIT_MESSAGE,
  MARK_DIALOG_AS_READ,
  MESSAGE_FIELDS,
} from "@/features/chat/api";

import { useMe } from "../common/use-me";
import { useChatDetails } from "../chat/use-chats";
import type { Message, User, Chat } from "@/entities/chat/model/types";

interface ValidationError {
  __typename: "ValidationError";
  message: string;
  field?: string;
}

type MessageWithTypename = Message & { __typename: "Message" };

interface SendMutationResult {
  sendMessage: MessageWithTypename | ValidationError;
}

interface UpdateMutationResult {
  updateMessage: MessageWithTypename | ValidationError;
}

interface SendMessageVariables {
  chatId: string;
  text: string;
  replyToId: string | null;
}

interface SendMessageOptions {
  variables?: Partial<SendMessageVariables>;
  optimisticResponse?: SendMutationResult;
  update?: (
    cache: ApolloCache,
    result: { data?: SendMutationResult | null },
  ) => void;
}

interface MessageActions {
  sendMessage: (text: string, options?: SendMessageOptions) => Promise<void>;
  editMessage: (id: string, text: string) => Promise<void>;
  markAsRead: () => void;
  isSending: boolean;
}

interface MessageConnection {
  messages: Reference[];
  hasMore: boolean;
}

interface PaginatedChats {
  chats: Reference[];
}

export function useMessageActions(chatId: string): MessageActions {
  const { data: meData } = useMe();
  const { data: chatData } = useChatDetails(chatId);

  const [send, { loading: isSending }] = useMutation<
    SendMutationResult,
    SendMessageVariables
  >(SEND_MESSAGE);

  const [edit] = useMutation<
    UpdateMutationResult,
    { id: string; text: string }
  >(EDIT_MESSAGE);

  const [read] = useMutation<{ markDialogAsRead: boolean }, { chatId: string }>(
    MARK_DIALOG_AS_READ,
  );

  const sendMessage = async (
    text: string,
    options?: SendMessageOptions,
  ): Promise<void> => {
    const me: User | undefined = meData?.me;
    const chat: Chat | undefined = chatData?.chat;

    if (!me || !chat) return;

    const finalVariables: SendMessageVariables = {
      chatId,
      text,
      replyToId: options?.variables?.replyToId ?? null,
    };

    const patchedOptions = { ...options };

    if (
      patchedOptions.optimisticResponse?.sendMessage?.__typename === "Message"
    ) {
      const optMsg = patchedOptions.optimisticResponse.sendMessage;
      patchedOptions.optimisticResponse = {
        sendMessage: {
          ...optMsg,
          sequence: optMsg.sequence ?? 0,
          forwardedFrom: optMsg.forwardedFrom ?? null,
          replyTo: optMsg.replyTo
            ? {
                ...optMsg.replyTo,
                __typename: "Message",
              }
            : null,
        } as unknown as MessageWithTypename,
      };
    }

    await send({
      ...patchedOptions,
      variables: finalVariables,
      update: (cache: ApolloCache, { data: mutationData }) => {
        const result = mutationData?.sendMessage;
        if (!result || result.__typename !== "Message") return;

        const newMessage: MessageWithTypename = {
          ...result,
          replyTo: result.replyTo ?? null,
          forwardedFrom: result.forwardedFrom ?? null,
        };

        const msgId: string | undefined = cache.identify({
          __typename: "Message",
          id: newMessage.id,
        });

        if (!msgId) return;

        cache.writeFragment({
          data: newMessage,
          fragment: MESSAGE_FIELDS,
        });

        const chatRef: string | undefined = cache.identify({
          __typename: "Chat",
          id: chatId,
        });

        if (chatRef) {
          cache.modify({
            id: chatRef,
            fields: {
              lastMessage: (): Reference => ({ __ref: msgId }),
              unreadCount: (): number => 0,
              myReadSequence: (prev: unknown): number => {
                const currentSeq: number = typeof prev === "number" ? prev : 0;
                return Math.max(currentSeq, Number(newMessage.sequence) || 0);
              },
            },
          });
        }

        cache.modify({
          fields: {
            messageHistory(
              existing: MessageConnection | Reference | undefined,
              { storeFieldName, readField }: ModifierDetails,
            ): MessageConnection | Reference | undefined {
              if (!storeFieldName.includes(chatId) || !existing)
                return existing;
              if ("__ref" in existing) return existing;

              const messages: Reference[] =
                (existing as MessageConnection).messages ?? [];
              if (
                messages.some(
                  (ref: Reference) => readField("id", ref) === newMessage.id,
                )
              ) {
                return existing;
              }

              return {
                ...existing,
                messages: [...messages, { __ref: msgId }],
              };
            },
          },
        });

        cache.modify({
          fields: {
            myChats(
              existing: PaginatedChats | Reference | undefined,
              { readField }: ModifierDetails,
            ): PaginatedChats | Reference | undefined {
              if (!existing || !chatRef) return existing;
              if ("__ref" in existing) return existing;

              const chats: Reference[] =
                (existing as PaginatedChats).chats ?? [];
              const chatRefObj: Reference = { __ref: chatRef };
              const filtered: Reference[] = chats.filter(
                (ref: Reference) => readField("id", ref) !== chatId,
              );
              return { ...existing, chats: [chatRefObj, ...filtered] };
            },
          },
        });

        if (options?.update) options.update(cache, { data: mutationData });
      },
    });
  };

  const editMessage = async (id: string, text: string): Promise<void> => {
    const me: User | undefined = meData?.me;
    if (!me) return;

    await edit({
      variables: { id, text },
      optimisticResponse: {
        updateMessage: {
          __typename: "Message",
          id,
          chatId,
          text,
          sentAt: new Date().toISOString(),
          isEdited: true,
          replyTo: null,
          forwardedFrom: null,
          sequence: 0,
          sender: me,
        } as unknown as MessageWithTypename,
      },
    });
  };

  const markAsRead = (): void => {
    const chat: Chat | undefined = chatData?.chat;
    const lastSeq: number = Number(
      chat?.lastMessage?.sequence ?? chat?.lastReadSequence ?? 0,
    );

    read({
      variables: { chatId },
      optimisticResponse: { markDialogAsRead: true },
      update: (cache: ApolloCache) => {
        const chatRef: string | undefined = cache.identify({
          __typename: "Chat",
          id: chatId,
        });

        if (chatRef) {
          cache.modify({
            id: chatRef,
            fields: {
              unreadCount: (): number => 0,
              myReadSequence: (prev: unknown): number => {
                const currentSeq: number = typeof prev === "number" ? prev : 0;
                return Math.max(currentSeq, lastSeq);
              },
            },
          });
        }
      },
    });
  };

  return { sendMessage, editMessage, markAsRead, isSending };
}
