import { useMutation } from "@apollo/client/react/index.js";
import { type ApolloCache } from "@apollo/client/index.js";
import {
  SEND_MESSAGE,
  EDIT_MESSAGE,
  MARK_DIALOG_AS_READ,
  GET_MY_CHATS,
} from "../../api";
import { encryptText, decryptText, getPrivateKey } from "@/shared/lib/crypto";
import { useMe } from "../common/use-me";
import { useChatDetails, type MyChatsResponse } from "../chat/use-chats";
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

export function useMessageActions(chatId: string) {
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
    const peer = chat?.members?.find(
      (m: ChatMember) => m.user.id !== me.id,
    )?.user;

    if (!peer?.publicKey) return message.text;

    try {
      const myPrivKeyObj = await getPrivateKey(me.id);
      if (!myPrivKeyObj) return message.text;
      return await decryptText(
        message.text,
        message.encryptionIv,
        peer.publicKey,
        myPrivKeyObj,
      );
    } catch {
      return "[Decryption Error]";
    }
  };

  const sendMessage = async (
    text: string,
    options?: SendMessageOptions,
  ): Promise<void> => {
    const me = meData?.me;
    const chat = chatData?.chat;
    if (!me || !chat) return;

    const peer = chat.members?.find(
      (m: ChatMember) => m.user.id !== me.id,
    )?.user;

    let finalVariables: SendMessageVariables = {
      chatId,
      text,
      isEncrypted: false,
      ...options?.variables,
    };

    if (chat.type === "PRIVATE" && peer?.publicKey) {
      try {
        const myPrivKeyObj = await getPrivateKey(me.id);
        if (myPrivKeyObj) {
          const encrypted = await encryptText(
            text,
            peer.publicKey,
            myPrivKeyObj,
          );
          finalVariables = {
            ...finalVariables,
            text: encrypted.ciphertext,
            isEncrypted: true,
            encryptionIv: encrypted.iv,
          };
        }
      } catch (err) {
        console.error(err);
      }
    }

    await send({
      ...options,
      variables: finalVariables,
      update: (cache: ApolloCache, { data: mutationData }): void => {
        const result = mutationData?.sendMessage;
        if (!result || result.__typename !== "Message") return;

        const newMessage = result as MessageWithTypename;
        const chatRef = cache.identify({ __typename: "Chat", id: chatId });

        if (chatRef) {
          cache.modify({
            id: chatRef,
            fields: {
              lastMessage: () => newMessage,
              unreadCount: () => 0,
            },
          });
        }

        const queryData = cache.readQuery<MyChatsResponse>({
          query: GET_MY_CHATS,
        });
        if (queryData?.myChats?.chats) {
          const existingChats = queryData.myChats.chats;
          const filteredChats = existingChats.filter((c) => c.id !== chatId);
          const targetChat =
            existingChats.find((c) => c.id === chatId) || chatData?.chat;

          if (targetChat) {
            cache.writeQuery<MyChatsResponse>({
              query: GET_MY_CHATS,
              data: {
                myChats: {
                  ...queryData.myChats,
                  chats: [
                    { ...targetChat, lastMessage: newMessage, unreadCount: 0 },
                    ...filteredChats,
                  ],
                },
              },
            });
          }
        }
        options?.update?.(cache, { data: mutationData });
      },
    });
  };

  const editMessage = async (id: string, text: string): Promise<void> => {
    const me = meData?.me;
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
          sender: me,
        } as MessageWithTypename,
      },
    });
  };

  const markAsRead = (): void => {
    read({
      variables: { chatId },
      optimisticResponse: { markDialogAsRead: true },
      update: (cache: ApolloCache): void => {
        const chatRef = cache.identify({ __typename: "Chat", id: chatId });
        if (chatRef) {
          cache.modify({
            id: chatRef,
            fields: {
              unreadCount: () => 0,
            },
          });
        }
      },
    });
  };

  return { sendMessage, editMessage, decryptMessage, markAsRead, isSending };
}
