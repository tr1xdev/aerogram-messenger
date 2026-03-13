import { useState, useEffect, useRef } from "react";
import { useApolloClient } from "@apollo/client/react";
import { gql } from "@apollo/client/index.js";
import { Skeleton } from "@/components/ui/skeleton";
import { decryptText, getPrivateKey } from "@/shared/lib/crypto";
import type { Chat, Message } from "@/entities/chat/model/types";

interface LastMessageContentProps {
  message: Message;
  myId: string;
  chat: Chat;
}

export function LastMessageContent({
  message,
  myId,
  chat,
}: LastMessageContentProps) {
  const client = useApolloClient();
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(
    message.isEncrypted,
  );
  const [lastProcessedMessageId, setLastProcessedMessageId] = useState<
    string | null
  >(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (lastProcessedMessageId !== message.id) {
    setLastProcessedMessageId(message.id);
    if (!message.isEncrypted) {
      setDecryptedText(null);
      setIsDecrypting(false);
    } else {
      setDecryptedText(null);
      setIsDecrypting(true);
    }
  }

  useEffect(() => {
    let isMounted = true;

    if (!message.isEncrypted) return;

    const performDecryption = async (): Promise<void> => {
      try {
        const myPrivKeyObj = await getPrivateKey(myId);
        const isMe = message.sender.id === myId;
        let targetPublicKey = isMe ? null : message.sender.publicKey;

        if (isMe) {
          const otherMember = chat.members?.find((m) => m.user.id !== myId);
          targetPublicKey = otherMember?.user.publicKey;
        }

        if (!targetPublicKey && !isMe) {
          const userInCache = client.cache.readFragment<{ publicKey: string }>({
            id: client.cache.identify({
              __typename: "User",
              id: message.sender.id,
            }),
            fragment: gql`
              fragment UserKey on User {
                publicKey
              }
            `,
          });
          targetPublicKey = userInCache?.publicKey;
        }

        if (!targetPublicKey || !myPrivKeyObj || !message.encryptionIv) {
          if (isMounted) {
            setDecryptedText("Encrypted");
            setIsDecrypting(false);
          }
          return;
        }

        const clearText = await decryptText(
          message.text,
          message.encryptionIv,
          targetPublicKey,
          myPrivKeyObj,
        );

        if (isMounted) {
          setDecryptedText(clearText);
          setIsDecrypting(false);
        }
      } catch {
        if (isMounted) {
          setDecryptedText("Decryption error");
          setIsDecrypting(false);
        }
      }
    };

    performDecryption();

    return () => {
      isMounted = false;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [
    message.id,
    message.text,
    message.encryptionIv,
    message.isEncrypted,
    message.sender.id,
    message.sender.publicKey,
    myId,
    chat.members,
    client.cache,
  ]);

  if (!message.isEncrypted) {
    return <span className="truncate">{message.text}</span>;
  }

  if (isDecrypting && !decryptedText) {
    return <Skeleton className="h-3 w-24" />;
  }

  return <span className="truncate">{decryptedText || "Encrypted"}</span>;
}
