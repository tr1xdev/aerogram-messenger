import { useState, useEffect } from "react";
import { Clock, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { decryptText, getPrivateKey } from "@/shared/lib/crypto";
import type { Message } from "@/entities/chat/model/types";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  isRead: boolean;
  myId: string;
  peerPublicKey?: string;
}

export function MessageBubble({
  message,
  isMe,
  isRead,
  myId,
  peerPublicKey,
}: MessageBubbleProps) {
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isTemp = message.id.startsWith("temp-") || message.id.length < 10;

  useEffect(() => {
    let isMounted = true;

    if (!message.isEncrypted) return;

    const decrypt = async (): Promise<void> => {
      try {
        const privKeyObj = await getPrivateKey(myId);
        const senderPubKey = isMe ? peerPublicKey : message.sender.publicKey;

        if (!privKeyObj || !senderPubKey || !message.encryptionIv) {
          if (isMounted) setError("Decryption error");
          return;
        }

        const result = await decryptText(
          message.text,
          message.encryptionIv,
          senderPubKey,
          privKeyObj,
        );

        if (isMounted) {
          setDecryptedText(result);
          setError(null);
        }
      } catch {
        if (isMounted) setError("Decryption error");
      }
    };

    decrypt();
    return () => {
      isMounted = false;
    };
  }, [
    message.id,
    message.isEncrypted,
    message.encryptionIv,
    myId,
    peerPublicKey,
    isMe,
  ]);

  return (
    <div
      className={cn(
        "flex w-full mb-1 px-4",
        isMe ? "justify-end" : "justify-start",
      )}
    >
      <div className={cn("flex flex-col max-w-[85%] sm:max-w-[70%] min-w-0")}>
        <div
          className={cn(
            "relative px-3 py-1.5 text-sm rounded-2xl shadow-sm",
            "whitespace-pre-wrap break-all [word-break:break-word] [overflow-wrap:anywhere]",
            isMe
              ? "bg-primary text-primary-foreground rounded-tr-none"
              : "bg-muted text-foreground rounded-tl-none",
            isTemp && "opacity-70",
          )}
        >
          <span>
            {message.isEncrypted
              ? (decryptedText ?? error ?? "...")
              : message.text}
          </span>

          <div
            className={cn(
              "float-right mt-2 ml-2 -mr-1 flex items-center gap-1 select-none pointer-events-none h-3",
              isMe ? "text-primary-foreground/70" : "text-muted-foreground/70",
            )}
          >
            <span className="text-[10px] leading-none">
              {new Date(message.sentAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            {isMe && (
              <span className="flex items-center justify-center w-3.5 h-3.5">
                {isTemp ? (
                  <Clock className="h-3 w-3 animate-pulse" />
                ) : isRead ? (
                  <CheckCheck className="h-3.5 w-3.5 text-primary-foreground" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
