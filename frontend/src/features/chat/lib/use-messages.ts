import { useQuery, useMutation } from "@apollo/client/react/index.js";
import {
  type MutationOptions,
  type ApolloCache,
  type Reference,
  gql,
} from "@apollo/client/index.js";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  SEND_MESSAGE,
  MARK_DIALOG_AS_READ,
  GET_MESSAGE_HISTORY,
  GET_ME,
  GET_MY_CHATS,
  SEARCH_USERS,
  CREATE_DIRECT_CHAT,
  PIN_CHAT,
  DELETE_CHAT,
  GET_CHAT_DETAILS,
} from "../api/chat.gql";
import { encryptText, getPrivateKey } from "@/shared/lib/crypto";
import type {
  Message,
  User,
  Chat,
  ChatMember,
} from "@/entities/chat/model/types";
import type { ModifierDetails } from "@apollo/client/cache";

export function useMe() {
  return useQuery<{ me: User }>(GET_ME);
}

export function useMyChats() {
  return useQuery<{ myChats: Chat[] }>(GET_MY_CHATS);
}

export function useChatDetails(identifier: string) {
  const isUuid = identifier.includes("-");

  return useQuery<{ chat: Chat }>(GET_CHAT_DETAILS, {
    variables: {
      id: isUuid ? identifier : null,
      slug: isUuid ? null : identifier,
    },
    skip: !identifier,
    fetchPolicy: "cache-and-network",
  });
}

export function useChatHistory(chatId: string) {
  const { data, loading, ...rest } = useQuery<{ messageHistory: Message[] }>(
    GET_MESSAGE_HISTORY,
    {
      variables: { chatId, limit: 50, offset: 0 },
      skip: !chatId,
      fetchPolicy: "cache-and-network",
    },
  );

  const sortedMessages = useMemo(() => {
    if (!data?.messageHistory) return [];
    return [...data.messageHistory].sort(
      (a: Message, b: Message) => (a.sequence ?? 0) - (b.sequence ?? 0),
    );
  }, [data]);

  return { data: sortedMessages, isLoading: loading, ...rest };
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
    const me = meData?.me;
    const chat = chatData?.chat;
    if (!me || !chat) return;

    const peerMember = chat.members?.find(
      (m: ChatMember) => m.user.id !== me.id,
    );
    const peer = peerMember?.user;

    let finalVariables: {
      chatId: string;
      text: string;
      isEncrypted: boolean;
      encryptionIv?: string;
    } = { chatId, text, isEncrypted: false };

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
      } catch (err: unknown) {
        console.error("[E2EE] Encryption failed", err);
      }
    }

    await send({
      variables: finalVariables,
      ...options,
      update: (cache: ApolloCache, { data }) => {
        const newMessage = data?.sendMessage;
        if (!newMessage) return;

        const chatRef = cache.identify({ __typename: "Chat", id: chatId });
        if (!chatRef) return;

        cache.modify({
          id: chatRef,
          fields: {
            lastMessage: () => newMessage,
            unreadCount: () => 0,
          },
        });

        cache.modify({
          fields: {
            myChats(existingRefs: readonly Reference[] = []) {
              const filtered = existingRefs.filter(
                (ref: Reference) => ref.__ref !== chatRef,
              );
              return [{ __ref: chatRef } as Reference, ...filtered];
            },
            messageHistory(
              existing: readonly Reference[] = [],
              { storeFieldName, readField }: ModifierDetails,
            ) {
              if (!storeFieldName.includes(chatId)) return existing;

              const alreadyExists = existing.some(
                (ref: Reference) => readField("id", ref) === newMessage.id,
              );
              if (alreadyExists) return existing;

              const newMessageRef = cache.writeFragment({
                data: newMessage,
                fragment: gql`
                  fragment NewMessage on Message {
                    id
                    sequence
                    text
                    sentAt
                  }
                `,
              });
              return newMessageRef ? [...existing, newMessageRef] : existing;
            },
          },
        });
      },
    });
  };

  const markAsRead = (lastSequence: number): void => {
    read({
      variables: { chatID: chatId, lastSequence: Number(lastSequence) },
      optimisticResponse: { markDialogAsRead: true },
      update: (cache: ApolloCache) => {
        const chatRef = cache.identify({ __typename: "Chat", id: chatId });
        if (chatRef) {
          cache.modify({
            id: chatRef,
            fields: {
              unreadCount: () => 0,
              lastReadSequence: (prev: number) =>
                Math.max(prev || 0, lastSequence),
            },
          });
        }
      },
    });
  };

  const createChat = async (userID: string): Promise<Chat | undefined> => {
    try {
      const result = await createDirect({
        variables: { userID },
        update: (cache: ApolloCache, { data }) => {
          const newChat = data?.createDirectChat;
          if (!newChat) return;
          cache.modify({
            fields: {
              myChats(existing: readonly Reference[] = []) {
                const newChatRef = cache.identify({
                  __typename: "Chat",
                  id: newChat.id,
                });
                if (
                  !newChatRef ||
                  existing.some((ref: Reference) => ref.__ref === newChatRef)
                )
                  return existing;
                return [{ __ref: newChatRef } as Reference, ...existing];
              },
            },
          });
        },
      });
      return result.data?.createDirectChat;
    } catch {
      toast.error("Failed to create chat");
      return undefined;
    }
  };

  const togglePin = async (pinned: boolean): Promise<void> => {
    if (pinned) {
      const pinnedCount =
        myChatsData?.myChats.filter((c: Chat) => c.isPinned).length ?? 0;
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
        optimisticResponse: { pinChat: true },
        update: (cache: ApolloCache) => {
          const chatRef = cache.identify({ __typename: "Chat", id: chatId });
          if (chatRef) {
            cache.modify({
              id: chatRef,
              fields: { isPinned: () => pinned },
            });
          }
        },
      });
    } catch {
      toast.error("Action failed");
    }
  };

  const deleteChat = async (forEveryone: boolean = false): Promise<boolean> => {
    try {
      const { data } = await remove({
        variables: {
          id: chatId,
          forEveryone,
        },
        update: (cache: ApolloCache) => {
          cache.modify({
            fields: {
              myChats(
                existing: readonly Reference[] = [],
                { readField }: ModifierDetails,
              ) {
                return existing.filter(
                  (ref: Reference) => readField("id", ref) !== chatId,
                );
              },
            },
          });
          cache.evict({
            id: cache.identify({ __typename: "Chat", id: chatId }),
          });
          cache.gc();
        },
      });
      return !!data?.deleteChat;
    } catch {
      toast.error("Failed to delete chat");
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
