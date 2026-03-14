import { useQuery, useMutation } from "@apollo/client/react/index.js";
import { type ApolloCache, type StoreObject } from "@apollo/client/index.js";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  SEND_MESSAGE,
  EDIT_MESSAGE,
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
import { encryptText, decryptText, getPrivateKey } from "@/shared/lib/crypto";
import type {
  Message,
  User,
  Chat,
  ChatMember,
} from "@/entities/chat/model/types";

export interface MyChatsResponse {
  myChats: {
    chats: Chat[];
    __typename?: string;
  };
}

interface SendMessageVariables {
  chatId: string;
  text: string;
  isEncrypted: boolean;
  encryptionIv?: string;
  replyToId?: string;
}

interface SendMutationResult {
  sendMessage: Message;
}

interface SendMessageOptions {
  variables?: Partial<SendMessageVariables>;
  optimisticResponse?:
    | SendMutationResult
    | ((vars: SendMessageVariables) => SendMutationResult);
  update?: (
    cache: ApolloCache,
    result: { data?: SendMutationResult | null },
  ) => void;
}

export function useMe(): ReturnType<typeof useQuery<{ me: User }>> {
  return useQuery<{ me: User }>(GET_ME);
}

export function useMyChats(): ReturnType<typeof useQuery<MyChatsResponse>> {
  return useQuery<MyChatsResponse>(GET_MY_CHATS);
}

export function useChatDetails(
  chatId: string,
): ReturnType<typeof useQuery<{ chat: Chat }>> {
  return useQuery<{ chat: Chat }>(GET_CHAT_DETAILS, {
    variables: { id: chatId },
    skip: !chatId,
    fetchPolicy: "cache-and-network",
  });
}

export function useChatHistory(chatId: string): {
  data: Message[];
  isLoading: boolean;
  [key: string]: unknown;
} {
  const { data, loading, ...rest } = useQuery<{
    messageHistory: { messages: Message[] };
  }>(GET_MESSAGE_HISTORY, {
    variables: { chatId, limit: 50, offset: 0 },
    skip: !chatId,
    fetchPolicy: "cache-and-network",
  });

  const sortedMessages: Message[] = useMemo((): Message[] => {
    const history: { messages: Message[] } | undefined = data?.messageHistory;
    if (!history?.messages) return [];
    return [...history.messages].sort(
      (a: Message, b: Message): number => (a.sequence ?? 0) - (b.sequence ?? 0),
    );
  }, [data]);

  return { data: sortedMessages, isLoading: loading, ...rest };
}

export function useSearchUsers(
  username: string,
): ReturnType<typeof useQuery<{ searchUsers: User[] }>> {
  return useQuery<{ searchUsers: User[] }>(SEARCH_USERS, {
    variables: { username },
    skip: username.length < 2,
  });
}

export function useChatActions(chatId: string): {
  sendMessage: (text: string, options?: SendMessageOptions) => Promise<void>;
  editMessage: (id: string, text: string) => Promise<void>;
  decryptMessage: (message: Message) => Promise<string>;
  isSending: boolean;
  markAsRead: (lastSequence: number) => void;
  createChat: (userID: string) => Promise<Chat | undefined>;
  togglePin: (pinned: boolean) => Promise<void>;
  deleteChat: (forEveryone?: boolean) => Promise<boolean>;
} {
  const { data: meData } = useMe();
  const { data: chatData } = useChatDetails(chatId);
  const { data: myChatsData } = useMyChats();

  const [send, { loading: isSending }] = useMutation<
    SendMutationResult,
    SendMessageVariables
  >(SEND_MESSAGE);

  const [edit] = useMutation<
    { editMessage: Message },
    { id: string; text: string }
  >(EDIT_MESSAGE);

  const [read] = useMutation<
    { markDialogAsRead: boolean },
    { chatId: string; lastSequence: number }
  >(MARK_DIALOG_AS_READ);

  const [createDirect] = useMutation<
    { createDirectChat: Chat },
    { userID: string }
  >(CREATE_DIRECT_CHAT);

  const [pin] = useMutation<
    { pinChat: { __typename: string; success?: boolean } },
    { id: string; pinned: boolean }
  >(PIN_CHAT);

  const [remove] = useMutation<
    { deleteChat: { __typename: string; success?: boolean } },
    { id: string; forEveryone: boolean }
  >(DELETE_CHAT);

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
    } catch {
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

    await send({
      ...options,
      variables: finalVariables,
      update: (cache: ApolloCache, { data: mutationData }): void => {
        const newMessage: Message | undefined = mutationData?.sendMessage;
        if (!newMessage) return;

        const chatIdentifier: StoreObject = {
          __typename: "Chat",
          id: chatId,
        };
        const chatRef: string | undefined = cache.identify(chatIdentifier);

        if (chatRef) {
          cache.modify({
            id: chatRef,
            fields: {
              lastMessage: (): Message => newMessage,
              unreadCount: (): number => 0,
            },
          });
        }

        const queryData: MyChatsResponse | null =
          cache.readQuery<MyChatsResponse>({
            query: GET_MY_CHATS,
          });

        if (queryData?.myChats?.chats) {
          const existingChats: Chat[] = queryData.myChats.chats;
          const filteredChats: Chat[] = existingChats.filter(
            (c: Chat): boolean => c.id !== chatId,
          );
          const targetChat: Chat | undefined =
            existingChats.find((c: Chat): boolean => c.id === chatId) ||
            chatData?.chat;

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
        editMessage: {
          __typename: "Message",
          id,
          chatId,
          text,
          sentAt: new Date().toISOString(),
          isRead: false,
          isEdited: true,
          isEncrypted: false,
          sender: me,
        } as unknown as Message,
      },
    });
  };

  const markAsRead = (lastSequence: number): void => {
    read({
      variables: { chatId, lastSequence: Number(lastSequence) },
      optimisticResponse: { markDialogAsRead: true },
      update: (cache: ApolloCache): void => {
        const chatIdentifier: StoreObject = {
          __typename: "Chat",
          id: chatId,
        };
        const chatRef: string | undefined = cache.identify(chatIdentifier);
        if (chatRef) {
          cache.modify({
            id: chatRef,
            fields: {
              unreadCount: (): number => 0,
              lastReadSequence: (prev: number): number =>
                Math.max(prev || 0, lastSequence),
            },
          });
        }
      },
    });
  };

  const createChat = async (userID: string): Promise<Chat | undefined> => {
    try {
      const result: { data?: { createDirectChat: Chat } | null } =
        await createDirect({
          variables: { userID },
          update: (cache: ApolloCache, { data: mutationData }): void => {
            const newChat: (Chat & { __typename?: string }) | undefined =
              mutationData?.createDirectChat;

            if (!newChat) return;

            const queryData: MyChatsResponse | null =
              cache.readQuery<MyChatsResponse>({
                query: GET_MY_CHATS,
              });

            if (queryData?.myChats?.chats) {
              const existingChats: Chat[] = queryData.myChats.chats;
              const exists: boolean = existingChats.some(
                (c: Chat): boolean => c.id === newChat.id,
              );

              if (!exists) {
                cache.writeQuery<MyChatsResponse>({
                  query: GET_MY_CHATS,
                  data: {
                    myChats: {
                      ...queryData.myChats,
                      chats: [newChat as Chat, ...existingChats],
                    },
                  },
                });
              }
            }
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
      const pinnedCount: number =
        myChatsData?.myChats.chats.filter((c: Chat): boolean => c.isPinned)
          .length ?? 0;

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
          pinChat: {
            __typename: "SuccessResult",
            success: true,
          },
        },
        update: (cache: ApolloCache): void => {
          const chatIdentifier: StoreObject = {
            __typename: "Chat",
            id: chatId,
          };
          const chatRef: string | undefined = cache.identify(chatIdentifier);
          if (chatRef) {
            cache.modify({
              id: chatRef,
              fields: { isPinned: (): boolean => pinned },
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
      const {
        data: mutationData,
      }: {
        data?: { deleteChat: { __typename: string; success?: boolean } } | null;
      } = await remove({
        variables: { id: chatId, forEveryone },
        update: (cache: ApolloCache): void => {
          const queryData: MyChatsResponse | null =
            cache.readQuery<MyChatsResponse>({
              query: GET_MY_CHATS,
            });

          if (queryData?.myChats?.chats) {
            cache.writeQuery<MyChatsResponse>({
              query: GET_MY_CHATS,
              data: {
                myChats: {
                  ...queryData.myChats,
                  chats: queryData.myChats.chats.filter(
                    (c: Chat): boolean => c.id !== chatId,
                  ),
                },
              },
            });
          }

          const chatIdentifier: StoreObject = {
            __typename: "Chat",
            id: chatId,
          };
          const chatRef: string | undefined = cache.identify(chatIdentifier);

          if (chatRef) {
            cache.evict({ id: chatRef });
            cache.gc();
          }
        },
      });
      return mutationData?.deleteChat?.__typename === "SuccessResult";
    } catch {
      toast.error("Failed to delete chat");
      return false;
    }
  };

  return {
    sendMessage,
    editMessage,
    decryptMessage,
    isSending,
    markAsRead,
    createChat,
    togglePin,
    deleteChat,
  };
}
