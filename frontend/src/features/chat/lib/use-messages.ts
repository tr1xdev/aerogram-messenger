import { useQuery, useMutation } from "@apollo/client/react";
import { type MutationOptions } from "@apollo/client";
import {
  SEND_MESSAGE,
  MARK_DIALOG_AS_READ,
  GET_MESSAGE_HISTORY,
  GET_ME,
  GET_CHAT_BY_ID,
  GET_MY_CHATS,
  SEARCH_USERS,
  CREATE_DIRECT_CHAT,
} from "../api/chat.gql";
import { encryptText } from "@/shared/lib/crypto";
import type { Message, User, Chat } from "@/entities/chat/model/types";

export function useMe() {
  return useQuery<{ me: User }>(GET_ME);
}

export function useMyChats() {
  return useQuery<{ myChats: Chat[] }>(GET_MY_CHATS);
}

export function useChatDetails(id: string) {
  return useQuery<{ chat: Chat }>(GET_CHAT_BY_ID, {
    variables: { id },
    skip: !id,
  });
}

export function useChatHistory(chatId: string) {
  const { data, loading, ...rest } = useQuery<{ messageHistory: Message[] }>(
    GET_MESSAGE_HISTORY,
    { variables: { chatId, limit: 50, offset: 0 }, skip: !chatId },
  );
  return { data: data?.messageHistory ?? [], isLoading: loading, ...rest };
}

export function useSearchUsers(username: string) {
  return useQuery<{ searchUsers: User[] }>(SEARCH_USERS, {
    variables: { username },
    skip: username.length < 2,
  });
}

export function useChatActions(chatId: string) {
  const { data: meData } = useMe();
  const { data: chatData } = useChatDetails(chatId);

  const [send, { loading }] = useMutation<{ sendMessage: Message }>(
    SEND_MESSAGE,
  );
  const [read] = useMutation<{ markDialogAsRead: boolean }>(
    MARK_DIALOG_AS_READ,
  );
  const [createDirect] = useMutation<{ createDirectChat: Chat }>(
    CREATE_DIRECT_CHAT,
  );

  const sendMessage = async (
    text: string,
    options?: MutationOptions<{ sendMessage: Message }>,
  ): Promise<void> => {
    const me = meData?.me;
    const chat = chatData?.chat;
    const peer = chat?.members?.find((m) => m.user.id !== me?.id)?.user;
    const myPrivKey = me ? localStorage.getItem(`e2ee_priv_${me.id}`) : null;

    let finalVariables = {
      chatId,
      text,
      isEncrypted: false,
      encryptionIv: undefined as string | undefined,
    };

    const isPrivate = chat?.type === "PRIVATE";

    if (isPrivate && peer?.publicKey && myPrivKey) {
      try {
        const encrypted = await encryptText(text, peer.publicKey, myPrivKey);
        finalVariables = {
          ...finalVariables,
          text: encrypted.ciphertext,
          isEncrypted: true,
          encryptionIv: encrypted.iv,
        };
      } catch {
        console.error("Encryption failed");
      }
    }

    await send({
      variables: finalVariables,
      ...options,
    });
  };

  const markAsRead = (lastSequence: number) =>
    read({ variables: { chatID: chatId, lastSequence } });

  const createChat = (userID: string) =>
    createDirect({ variables: { userID } });

  return { sendMessage, isSending: loading, markAsRead, createChat };
}
