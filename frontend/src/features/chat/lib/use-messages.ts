import { useQuery, useMutation } from "@apollo/client/react/index.js";
import { type MutationOptions } from "@apollo/client/index.js";
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
import { encryptText, getPrivateKey } from "@/shared/lib/crypto";
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

  const sendMessage = async (
    text: string,
    options?: MutationOptions<{ sendMessage: Message }>,
  ): Promise<void> => {
    const me = meData?.me;
    const chat = chatData?.chat;
    const peerMember = chat?.members?.find(
      (m: ChatMember): boolean => m.user.id !== me?.id,
    );
    const peer = peerMember?.user;

    const isPrivate = chat?.type === "PRIVATE" || chat?.type === "DIRECT";

    console.log("[E2EE DEBUG]", {
      chatType: chat?.type,
      isPrivate,
      myId: me?.id,
      peerId: peer?.id,
      hasPeerPublicKey: !!peer?.publicKey,
    });

    let finalVariables = {
      chatId,
      text,
      isEncrypted: false,
      encryptionIv: undefined as string | undefined,
    };

    if (isPrivate && peer?.publicKey && me) {
      try {
        const myPrivKeyObj = await getPrivateKey(me.id);

        if (myPrivKeyObj) {
          console.log("[E2EE] Encrypting message...");
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
        } else {
          console.warn("[E2EE] Private key not found in local storage");
        }
      } catch (err: unknown) {
        console.error("[E2EE] Encryption failed", err);
      }
    } else {
      console.warn("[E2EE] Conditions not met", {
        isPrivate,
        hasPeerKey: !!peer?.publicKey,
      });
    }

    await send({
      variables: finalVariables,
      ...options,
    });
  };

  const markAsRead = (lastSequence: number): void => {
    read({ variables: { chatID: chatId, lastSequence: Number(lastSequence) } });
  };

  const createChat = (userID: string): void => {
    createDirect({ variables: { userID } });
  };

  return { sendMessage, isSending: loading, markAsRead, createChat };
}
