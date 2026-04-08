import { useApolloClient, useMutation } from "@apollo/client/react/index.js";
import { useCallback, useRef } from "react";
import { type Reference, type StoreObject, gql } from "@apollo/client/index.js";
import type { Message } from "@/entities/chat/model/types";
import { MARK_DIALOG_AS_READ } from "@/features/chat/api";

interface MarkReadResponse {
  markDialogAsRead: boolean;
}

interface ChatReadFields {
  unreadCount: number;
  myReadSequence: number;
}

export function useMarkDialog(
  chatId: string,
  messages: Message[],
  me?: { id: string },
) {
  const client = useApolloClient();
  const isPendingRef = useRef<boolean>(false);
  const [markDialog] = useMutation<MarkReadResponse>(MARK_DIALOG_AS_READ);

  const checkAndMarkRead = useCallback(async (): Promise<void> => {
    if (
      document.visibilityState !== "visible" ||
      !me ||
      !chatId ||
      isPendingRef.current ||
      messages.length === 0
    ) {
      return;
    }

    const cache = client.cache;
    const chatCacheId: string | undefined = cache.identify({
      __typename: "Chat",
      id: chatId,
    });

    if (!chatCacheId) return;

    const lastValidMessage: Message | undefined = [...messages]
      .reverse()
      .find((m: Message): boolean => typeof m.sequence === "number");

    const lastSeqInChat: number = lastValidMessage?.sequence || 0;

    const cachedData: ChatReadFields | null =
      cache.readFragment<ChatReadFields>({
        id: chatCacheId,
        fragment: gql`
          fragment ChatReadStatus on Chat {
            unreadCount
            myReadSequence
          }
        `,
      });

    const currentReadSeq: number = cachedData?.myReadSequence ?? 0;
    const currentUnreadCount: number = cachedData?.unreadCount ?? 0;

    if (currentUnreadCount === 0 && currentReadSeq >= lastSeqInChat) {
      return;
    }

    isPendingRef.current = true;

    try {
      await markDialog({
        variables: { chatId },
        optimisticResponse: { markDialogAsRead: true },
        onCompleted: (data: MarkReadResponse): void => {
          if (!data.markDialogAsRead) return;

          cache.modify({
            id: chatCacheId,
            fields: {
              unreadCount: (): number => 0,
              myReadSequence: (prev: number = 0): number =>
                Math.max(prev, lastSeqInChat),
              members: (
                existingMembers: ReadonlyArray<Reference | StoreObject> = [],
                { readField },
              ): (Reference | StoreObject)[] => {
                return existingMembers.map(
                  (memberRefOrObj): Reference | StoreObject => {
                    const userRecord: Reference | StoreObject | undefined =
                      readField<Reference | StoreObject>(
                        "user",
                        memberRefOrObj,
                      );
                    const userId: string | undefined = userRecord
                      ? readField<string>("id", userRecord)
                      : undefined;

                    if (userId === me.id) {
                      const currentMemberSeq: number =
                        readField<number>("lastReadSequence", memberRefOrObj) ??
                        0;
                      return {
                        ...memberRefOrObj,
                        lastReadSequence: Math.max(
                          currentMemberSeq,
                          lastSeqInChat,
                        ),
                      } as StoreObject;
                    }
                    return memberRefOrObj as StoreObject;
                  },
                );
              },
            },
          });
        },
      });
    } catch (error: unknown) {
      console.error(error);
    } finally {
      isPendingRef.current = false;
    }
  }, [chatId, messages, me, markDialog, client]);

  return { checkAndMarkRead };
}
