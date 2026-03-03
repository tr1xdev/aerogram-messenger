import { useState, useEffect } from "react";
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
  const [decryptedText, setDecryptedText] = useState<string | null>(
    message.isEncrypted ? null : message.text,
  );

  useEffect(() => {
    let isMounted = true;
    if (!message.isEncrypted) return;

    const performDecryption = async (): Promise<void> => {
      try {
        const isMe = message.sender.id === myId;
        const otherMember = chat.members?.find((m) => m.user.id !== myId);
        const targetPublicKey = isMe
          ? otherMember?.user.publicKey
          : message.sender.publicKey;

        const myPrivKeyObj = await getPrivateKey(myId);

        if (!targetPublicKey || !myPrivKeyObj || !message.encryptionIv) {
          if (isMounted) setDecryptedText("Encrypted");
          return;
        }

        const clearText = await decryptText(
          message.text,
          message.encryptionIv,
          targetPublicKey,
          myPrivKeyObj,
        );

        if (isMounted) setDecryptedText(clearText);
      } catch {
        if (isMounted) setDecryptedText("Decryption error");
      }
    };

    performDecryption();
    return () => {
      isMounted = false;
    };
  }, [
    message.id,
    message.isEncrypted,
    message.encryptionIv,
    myId,
    chat.members,
  ]);

  if (decryptedText === null) {
    return <Skeleton className="h-3 w-24 mt-1" />;
  }

  return (
    <span className="truncate animate-in fade-in duration-300">
      {decryptedText}
    </span>
  );
}
