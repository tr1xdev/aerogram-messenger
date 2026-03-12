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
  const { data: myChatsData } = useMyChats();

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
    const me: User | undefined = meData?.me;
    const chat: Chat | undefined = chatData?.chat;
    const peerMember: ChatMember | undefined = chat?.members?.find(
      (m: ChatMember): boolean => m.user.id !== me?.id,
    );
    const peer: User | undefined = peerMember?.user;
    const isPrivate: boolean = chat?.type === "PRIVATE";

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
            unreadCount: (): number => 0,
            lastReadSequence: (): number => lastSequence,
          },
        });
      },
    });
  };

  const createChat = async (userID: string): Promise<Chat | undefined> => {
    try {
      const result = await createDirect({ variables: { userID } });
      return result.data?.createDirectChat;
    } catch {
      toast.error("Failed to create chat", {
        description: "Please try again later.",
      });
      return undefined;
    }
  };

  const togglePin = async (pinned: boolean): Promise<void> => {
    if (pinned) {
      const pinnedCount: number =
        myChatsData?.myChats.filter((c: Chat): boolean => c.isPinned).length ??
        0;

      if (pinnedCount >= 5) {
        toast.error("Limit reached", {
          description: "You can pin up to 5 chats maximum.",
        });
        return;
      }
    }

    try {
      await pin({
        variables: { id: chatId, pinned },
        optimisticResponse: {
          pinChat: true,
        },
        update: (cache: ApolloCache) => {
          const cacheId: string | undefined = cache.identify({
            __typename: "Chat",
            id: chatId,
          });
          cache.modify({
            id: cacheId,
            fields: {
              isPinned: (): boolean => pinned,
            },
          });
        },
      });
    } catch (err: unknown) {
      const error: Error = err as Error;
      const isLimit: boolean = error.message.toLowerCase().includes("limit");

      toast.error(isLimit ? "Pin limit reached" : "Action failed", {
        description: isLimit
          ? "The server did not allow pinning more chats."
          : "Something went wrong while updating chat status.",
      });
    }
  };

  const deleteChat = async (): Promise<boolean> => {
    try {
      const { data } = await remove({
        variables: { id: chatId },
        update: (cache: ApolloCache) => {
          const existing: { myChats: Chat[] } | null = cache.readQuery({
            query: GET_MY_CHATS,
          });

          if (existing) {
            cache.writeQuery({
              query: GET_MY_CHATS,
              data: {
                myChats: existing.myChats.filter(
                  (c: Chat): boolean => c.id !== chatId,
                ),
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
        toast.success("Chat removed", {
          description: "The conversation was deleted from your account.",
        });
        return true;
      }
      return false;
    } catch (err: unknown) {
      const error: Error = err as Error;
      toast.error("Delete failed", {
        description: error.message || "Failed to delete the chat.",
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
