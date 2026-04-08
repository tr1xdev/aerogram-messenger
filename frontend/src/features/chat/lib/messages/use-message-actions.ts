import { useMutation } from "@apollo/client/react/index.js";
import {
  type ApolloCache,
  type Reference,
  type StoreObject,
} from "@apollo/client/index.js";
import { type ModifierDetails } from "@apollo/client/cache/index.js";
import { SEND_MESSAGE, EDIT_MESSAGE, MARK_DIALOG_AS_READ } from "../../api";
import { encryptText, decryptText, getPrivateKey } from "@/shared/lib/crypto";
import { useMe } from "../common/use-me";
import { useChatDetails } from "../chat/use-chats";
import type {
  Message,
  User,
  Chat,
  ChatMember,
} from "@/entities/chat/model/types";

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
  isEncrypted: boolean;
  encryptionIv?: string;
  replyToId?: string;
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
  decryptMessage: (message: Message) => Promise<string>;
  markAsRead: () => void;
  isSending: boolean;
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

  const decryptMessage = async (message: Message): Promise<string> => {
    if (!message.isEncrypted || !message.encryptionIv || !meData?.me) {
      return message.text;
    }

    const me: User = meData.me;
    const chat: Chat | undefined = chatData?.chat;
    const peer: User | undefined = chat?.members?.find(
      (m: ChatMember): boolean => m.user.id !== me.id,
    )?.user;

    if (!peer?.publicKey) return message.text;

    try {
      const myPrivKeyObj: CryptoKey | null = await getPrivateKey(me.id);
      if (!myPrivKeyObj) return message.text;

      return await decryptText(
        message.text,
        message.encryptionIv,
        peer.publicKey,
        myPrivKeyObj,
      );
    } catch (error: unknown) {
      console.error(error);
      return "[Decryption Error]";
    }
  };

  const sendMessage = async (
    text: string,
    options?: SendMessageOptions,
  ): Promise<void> => {
    const me: User | undefined = meData?.me;
    const chat: Chat | undefined = chatData?.chat;

    if (!me || !chat) return;

    const peer: User | undefined = chat.members?.find(
      (m: ChatMember): boolean => m.user.id !== me.id,
    )?.user;

    let finalVariables: SendMessageVariables = {
      chatId,
      text,
      isEncrypted: false,
      ...options?.variables,
    };

    if (chat.type === "PRIVATE" && peer?.publicKey) {
      try {
        const myPrivKeyObj: CryptoKey | null = await getPrivateKey(me.id);
        if (myPrivKeyObj) {
          const encrypted: { ciphertext: string; iv: string } =
            await encryptText(text, peer.publicKey, myPrivKeyObj);
          finalVariables = {
            ...finalVariables,
            text: encrypted.ciphertext,
            isEncrypted: true,
            encryptionIv: encrypted.iv,
          };
        }
      } catch (err: unknown) {
        console.error(err);
      }
    }

    const patchedOptions = { ...options };
    if (
      patchedOptions.optimisticResponse &&
      "sendMessage" in patchedOptions.optimisticResponse
    ) {
      const optMsg = patchedOptions.optimisticResponse.sendMessage;
      if ("__typename" in optMsg && optMsg.__typename === "Message") {
        patchedOptions.optimisticResponse = {
          sendMessage: {
            ...optMsg,
            encryptionIv: optMsg.encryptionIv ?? null,
            replyTo: optMsg.replyTo ?? null,
            forwardedFrom: optMsg.forwardedFrom ?? null,
          } as MessageWithTypename,
        };
      }
    }

    await send({
      ...patchedOptions,
      variables: finalVariables,
      update: (
        cache: ApolloCache,
        { data: mutationData }: { data?: SendMutationResult | null },
      ): void => {
        const result: MessageWithTypename | ValidationError | undefined =
          mutationData?.sendMessage;

        if (!result || result.__typename !== "Message") return;

        const newMessage: MessageWithTypename = result as MessageWithTypename;

        const chatCacheId: string | undefined = cache.identify({
          __typename: "Chat",
          id: chatId,
        });

        if (chatCacheId) {
          cache.modify({
            id: chatCacheId,
            fields: {
              lastMessage: (
                existing: Reference | Message | undefined,
                { readField }: ModifierDetails,
              ): Reference | Message | undefined => {
                const existingSeq: number =
                  (readField(
                    "sequence",
                    existing as unknown as StoreObject,
                  ) as number) ?? 0;
                const newSeq: number = newMessage.sequence ?? 0;

                return existing && existingSeq > newSeq ? existing : newMessage;
              },
              unreadCount: (): number => 0,
              myReadSequence: (prev: number | undefined): number => {
                return Math.max(prev || 0, newMessage.sequence ?? 0);
              },
            },
          });

          cache.modify({
            fields: {
              myChats(
                existingData: Reference | StoreObject,
                { readField }: ModifierDetails,
              ): StoreObject | Reference {
                const existingChats: Reference[] | undefined = readField(
                  "chats",
                  existingData,
                ) as Reference[] | undefined;

                if (!existingChats) return existingData;

                const chatRef: Reference = { __ref: chatCacheId };
                const filtered: Reference[] = existingChats.filter(
                  (ref: Reference): boolean =>
                    (readField("id", ref) as string) !== chatId,
                );

                return {
                  ...(existingData as unknown as StoreObject),
                  chats: [chatRef, ...filtered],
                };
              },
            },
          });
        }

        if (options?.update) {
          options.update(cache, { data: mutationData });
        }
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
          isRead: false,
          isEdited: true,
          isEncrypted: false,
          encryptionIv: null,
          replyTo: null,
          forwardedFrom: null,
          sender: me,
        } as unknown as MessageWithTypename,
      },
    });
  };

  const markAsRead = (): void => {
    const chat: Chat | undefined = chatData?.chat;
    const lastSeq: number =
      chat?.lastMessage?.sequence ?? chat?.lastReadSequence ?? 0;

    read({
      variables: { chatId },
      optimisticResponse: { markDialogAsRead: true },
      update: (cache: ApolloCache): void => {
        const chatRef: string | undefined = cache.identify({
          __typename: "Chat",
          id: chatId,
        });
        if (chatRef) {
          cache.modify({
            id: chatRef,
            fields: {
              unreadCount: (): number => 0,
              myReadSequence: (prev: number | undefined): number =>
                Math.max(prev || 0, lastSeq),
            },
          });
        }
      },
    });
  };

  return {
    sendMessage,
    editMessage,
    decryptMessage,
    markAsRead,
    isSending,
  };
}
