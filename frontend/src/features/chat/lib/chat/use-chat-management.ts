import { useMutation, useQuery } from "@apollo/client/react/index.js";
import { type ApolloCache } from "@apollo/client/index.js";
import { toast } from "sonner";
import {
  CREATE_DIRECT_CHAT,
  PIN_CHAT,
  DELETE_CHAT,
  GET_MY_CHATS,
  SEARCH_USERS,
} from "@/features/chat/api";
import { useMyChats, type MyChatsResponse } from "./use-chats";
import type { Chat, User } from "@/entities/chat/model/types";

interface ChatError {
  __typename: "ForbiddenError" | "ValidationError" | "InternalError";
  message: string;
}

type CreateChatResponse = {
  createDirectChat: (Chat & { __typename: "Chat" }) | ChatError;
};

export function useSearchUsers(username: string) {
  return useQuery<{ searchUsers: User[] }, { username: string }>(SEARCH_USERS, {
    variables: { username },
    skip: username.length < 2,
  });
}

export function useChatActions(chatId?: string) {
  const { data: myChatsData } = useMyChats();

  const [createDirect] = useMutation<CreateChatResponse, { userID: string }>(
    CREATE_DIRECT_CHAT,
  );

  const [pin] = useMutation<
    { pinChat: { success?: boolean } },
    { id: string; pinned: boolean }
  >(PIN_CHAT);

  const [remove] = useMutation<
    { deleteChat: { success?: boolean } },
    { id: string; forEveryone: boolean }
  >(DELETE_CHAT);

  const createChat = async (userID: string): Promise<Chat | undefined> => {
    try {
      const { data: mutationData } = await createDirect({
        variables: { userID },
        update: (cache: ApolloCache, { data: result }): void => {
          const response = result?.createDirectChat;

          if (!response || response.__typename !== "Chat") {
            return;
          }

          const newChat: Chat = response;

          const queryData = cache.readQuery<MyChatsResponse>({
            query: GET_MY_CHATS,
          });

          if (queryData?.myChats && "chats" in queryData.myChats) {
            const existingChats: Chat[] = queryData.myChats.chats;

            if (!existingChats.some((c) => c.id === newChat.id)) {
              cache.writeQuery<MyChatsResponse>({
                query: GET_MY_CHATS,
                data: {
                  myChats: {
                    ...queryData.myChats,
                    __typename: "ChatList",
                    chats: [newChat, ...existingChats],
                  },
                },
              });
            }
          }
        },
      });

      const finalResponse = mutationData?.createDirectChat;

      if (finalResponse?.__typename === "Chat") {
        return finalResponse;
      }

      if (finalResponse) {
        toast.error(finalResponse.message);
      }

      return undefined;
    } catch {
      toast.error("Failed to create chat");
      return undefined;
    }
  };

  const togglePin = async (pinned: boolean): Promise<void> => {
    if (!chatId) return;
    if (pinned) {
      const chats =
        myChatsData?.myChats && "chats" in myChatsData.myChats
          ? myChatsData.myChats.chats
          : [];

      const pinnedCount = chats.filter((c: Chat) => c.isPinned).length;

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
        update: (cache: ApolloCache): void => {
          const chatRef = cache.identify({ __typename: "Chat", id: chatId });
          if (chatRef) {
            cache.modify({
              id: chatRef,
              fields: {
                isPinned: () => pinned,
              },
            });
          }
        },
      });
    } catch {
      toast.error("Action failed");
    }
  };

  const deleteChat = async (forEveryone = false): Promise<boolean> => {
    if (!chatId) return false;
    try {
      const { data: mutationData } = await remove({
        variables: { id: chatId, forEveryone },
        update: (cache: ApolloCache): void => {
          const queryData = cache.readQuery<MyChatsResponse>({
            query: GET_MY_CHATS,
          });

          if (queryData?.myChats && "chats" in queryData.myChats) {
            cache.writeQuery<MyChatsResponse>({
              query: GET_MY_CHATS,
              data: {
                myChats: {
                  ...queryData.myChats,
                  chats: queryData.myChats.chats.filter(
                    (c: Chat) => c.id !== chatId,
                  ),
                },
              },
            });
          }

          const chatRef = cache.identify({ __typename: "Chat", id: chatId });
          if (chatRef) {
            cache.evict({ id: chatRef });
            cache.gc();
          }
        },
      });
      return !!mutationData;
    } catch {
      toast.error("Failed to delete chat");
      return false;
    }
  };

  return { createChat, togglePin, deleteChat };
}

export const useChatManagement = useChatActions;
