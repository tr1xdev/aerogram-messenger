import { useCallback, useRef } from "react";
import { graphql, useMutation, useFragment } from "react-relay";
import type { RecordSourceSelectorProxy, RecordProxy } from "relay-runtime";
import type { useMarkDialog_chat$key } from "./__generated__/useMarkDialog_chat.graphql";
import type { useMarkDialogMutation } from "./__generated__/useMarkDialogMutation.graphql";

const markDialogMutation = graphql`
  mutation useMarkDialogMutation($chatId: ID!) {
    markDialogAsRead(chatId: $chatId)
  }
`;

const chatReadFragment = graphql`
  fragment useMarkDialog_chat on Chat {
    id
    unreadCount
    myReadSequence
    members {
      user {
        id
      }
      lastReadSequence
    }
  }
`;

export function useMarkDialog(
  chatKey: useMarkDialog_chat$key | null,
  lastSequence: number,
  meId: string | undefined,
): { checkAndMarkRead: () => void } {
  const chat = useFragment(chatReadFragment, chatKey);
  const [commit] = useMutation<useMarkDialogMutation>(markDialogMutation);
  const isPendingRef = useRef<boolean>(false);

  const chatId: string | undefined = chat?.id;
  const myReadSequence: number = chat?.myReadSequence ?? 0;
  const unreadCount: number = chat?.unreadCount ?? 0;

  const checkAndMarkRead = useCallback((): void => {
    if (
      !chatId ||
      document.visibilityState !== "visible" ||
      !meId ||
      isPendingRef.current ||
      lastSequence <= myReadSequence ||
      unreadCount === 0
    ) {
      return;
    }

    isPendingRef.current = true;

    const updateStore = (store: RecordSourceSelectorProxy): void => {
      const chatRecord: RecordProxy | null | undefined = store.get(chatId);
      if (!chatRecord) return;

      chatRecord.setValue(0, "unreadCount");

      const prevSequence: number = Number(
        chatRecord.getValue("myReadSequence") ?? 0,
      );
      chatRecord.setValue(
        Math.max(prevSequence, lastSequence),
        "myReadSequence",
      );

      const members: readonly RecordProxy[] | null | undefined =
        chatRecord.getLinkedRecords("members");

      if (members) {
        members.forEach((member: RecordProxy): void => {
          const user: RecordProxy | null | undefined =
            member.getLinkedRecord("user");
          if (user?.getValue("id") === meId) {
            const prevMemberSeq: number = Number(
              member.getValue("lastReadSequence") ?? 0,
            );
            member.setValue(
              Math.max(prevMemberSeq, lastSequence),
              "lastReadSequence",
            );
          }
        });
      }
    };

    commit({
      variables: { chatId },
      optimisticUpdater: updateStore,
      updater: updateStore,
      onCompleted: (): void => {
        isPendingRef.current = false;
      },
      onError: (): void => {
        isPendingRef.current = false;
      },
    });
  }, [chatId, myReadSequence, unreadCount, lastSequence, meId, commit]);

  return { checkAndMarkRead };
}
