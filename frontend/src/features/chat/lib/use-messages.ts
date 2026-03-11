import { useQuery, useMutation } from "@apollo/client/react/index.js";
import { type MutationOptions, ApolloCache } from "@apollo/client/index.js";
import { toast } from "sonner";
import {
  SEND_MESSAGE,
  MARK_DIALOG_AS_READ,
  GET_MESSAGE_HISTORY,
  GET_ME,
  GET_CHAT_BY_ID,
  GET_MY_CHATS,
  SEARCH_USERS,
  CREATE_DIRECT_CHAT,
  PIN_CHAT,
  DELETE_CHAT,
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

  const [send, { loading: isSending }] = useMutation<{ sendMessage: Message }>(
    SEND_MESSAGE,
  );
  const [read] = useMutation<{ markDialogAsRead: boolean }>(
    MARK_DIALOG_AS_READ,
  );
  const [createDirect] = useMutation<{ createDirectChat: Chat }>(
    CREATE_DIRECT_CHAT,
  );
  const [pin] = useMutation<{ pinChat: boolean }>(PIN_CHAT);
  const [remove] = useMutation<{ deleteChat: boolean }>(DELETE_CHAT);

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
    const isPrivate = chat?.type === "PRIVATE";

    let finalVariables: {
      chatId: string;
      text: string;
      isEncrypted: boolean;
      encryptionIv?: string;
    } = {
      chatId,
      text,
      isEncrypted: false,
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
      variables: finalVariables,
      ...options,
    });
  };

  const markAsRead = (lastSequence: number): void => {
    read({
      variables: { chatID: chatId, lastSequence: Number(lastSequence) },
      optimisticResponse: { markDialogAsRead: true },
      update: (cache: ApolloCache) => {
        cache.modify({
          id: cache.identify({ __typename: "Chat", id: chatId }),
          fields: {
            unreadCount: () => 0,
            lastReadSequence: () => lastSequence,
          },
        });
      },
    });
  };

  const createChat = async (userID: string): Promise<Chat | undefined> => {
    const result = await createDirect({ variables: { userID } });
    return result.data?.createDirectChat;
  };

  const togglePin = async (pinned: boolean): Promise<void> => {
    try {
      await pin({
        variables: { id: chatId, pinned },
        optimisticResponse: { pinChat: true },
        update: (cache: ApolloCache) => {
          cache.modify({
            id: cache.identify({ __typename: "Chat", id: chatId }),
            fields: {
              isPinned: () => pinned,
            },
          });
        },
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message.toLowerCase().includes("limit reached")) {
        toast.error("Pin limit reached", {
          description: "You can only pin up to 5 chats.",
        });
      } else {
        toast.error("Action failed", {
          description: "Could not update pin status.",
        });
      }
    }
  };

  const deleteChat = async (): Promise<boolean> => {
    try {
      const { data } = await remove({
        variables: { id: chatId },
        update: (cache: ApolloCache) => {
          const existing = cache.readQuery<{ myChats: Chat[] }>({
            query: GET_MY_CHATS,
          });

          if (existing) {
            cache.writeQuery({
              query: GET_MY_CHATS,
              data: {
                myChats: existing.myChats.filter((c) => c.id !== chatId),
              },
            });
          }

          cache.evict({
            id: cache.identify({ __typename: "Chat", id: chatId }),
          });
          cache.gc();
        },
      });
      if (data?.deleteChat) {
        toast.success("Chat deleted");
        return true;
      }
      return false;
    } catch (err: unknown) {
      const error = err as Error;
      toast.error("Delete failed", {
        description: error.message || "Something went wrong",
      });
      return false;
    }
  };

  return {
    sendMessage,
    isSending,
    markAsRead,
    createChat,
    togglePin,
    deleteChat,
  };
}
