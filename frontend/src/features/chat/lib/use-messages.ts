import {
  useQuery,
  useMutation,
  type MutationFunctionOptions,
} from "@apollo/client/react/index.js";
import {
  SEND_MESSAGE,
  MARK_DIALOG_AS_READ,
  GET_MESSAGE_HISTORY,
  GET_ME,
  GET_CHAT_BY_ID,
  GET_MY_CHATS,
  SEARCH_USERS,
  CREATE_DIRECT_CHAT,
  DELETE_MESSAGE,
  UPDATE_MESSAGE,
} from "../api/chat.gql";
import { encryptText, decryptText, getPrivateKey } from "@/shared/lib/crypto";
import type {
  Message,
  User,
  Chat,
  ChatMember,
} from "@/entities/chat/model/types";

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
  const [remove] = useMutation<{ deleteMessage: boolean }>(DELETE_MESSAGE);
  const [update] = useMutation<{ updateMessage: Message }>(UPDATE_MESSAGE);

  const decryptMessage = async (message: Message): Promise<string> => {
    if (!message.isEncrypted || !message.encryptionIv || !meData?.me)
      return message.text;

    const me = meData.me;
    const chat = chatData?.chat;
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
      return "[Ошибка расшифровки]";
    }
  };

  const sendMessage = async (
    text: string,
    options?: MutationFunctionOptions<{ sendMessage: Message }>,
  ): Promise<void> => {
    const me = meData?.me;
    const chat = chatData?.chat;
    const peer = chat?.members?.find(
      (m: ChatMember) => m.user.id !== me?.id,
    )?.user;
    const isPrivate = chat?.type === "PRIVATE" || chat?.type === "DIRECT";

    let finalVariables: Record<string, unknown> = {
      chatId,
      text,
      isEncrypted: false,
      encryptionIv: undefined,
      replyToId: options?.variables?.replyToId,
    };

    if (isPrivate && peer?.publicKey && me) {
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
      } catch (err: unknown) {
        console.error("[E2EE] Encryption failed", err);
      }
    }

    await send({
      ...options,
      variables: finalVariables,
    });
  };

  const editMessage = async (id: string, newText: string): Promise<void> => {
    const me = meData?.me;
    const chat = chatData?.chat;
    const peer = chat?.members?.find(
      (m: ChatMember) => m.user.id !== me?.id,
    )?.user;
    const isPrivate = chat?.type === "PRIVATE" || chat?.type === "DIRECT";

    let finalText = newText;

    if (isPrivate && peer?.publicKey && me) {
      try {
        const myPrivKeyObj = await getPrivateKey(me.id);
        if (myPrivKeyObj) {
          const encrypted = await encryptText(
            newText,
            peer.publicKey,
            myPrivKeyObj,
          );
          finalText = encrypted.ciphertext;
        }
      } catch (err: unknown) {
        console.error("[E2EE] Re-encryption failed", err);
      }
    }

    await update({ variables: { id, text: finalText } });
  };

  const deleteMessage = async (id: string): Promise<void> => {
    await remove({
      variables: { id },
      update: (cache) => {
        cache.evict({ id: cache.identify({ __typename: "Message", id }) });
        cache.gc();
      },
    });
  };

  const markAsRead = (lastSequence: number): void => {
    read({ variables: { chatID: chatId, lastSequence: Number(lastSequence) } });
  };

  const createChat = async (userID: string): Promise<Chat | undefined> => {
    const result = await createDirect({ variables: { userID } });
    return result.data?.createDirectChat;
  };

  return {
    sendMessage,
    decryptMessage,
    isSending: loading,
    markAsRead,
    createChat,
    deleteMessage,
    editMessage,
  };
}
