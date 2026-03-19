import { useState, useEffect, useMemo } from "react";
import { useApolloClient } from "@apollo/client/react";
import { gql } from "@apollo/client/index.js";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Skeleton } from "@/components/ui/skeleton";
import { decryptText, getPrivateKey } from "@/shared/lib/crypto";
import type { Chat, Message } from "@/entities/chat/model/types";
import {
  LuTerminal,
  LuTable,
  LuImage,
  LuList,
  LuListOrdered,
  LuQuote,
} from "react-icons/lu";

interface LastMessageContentProps {
  message: Message;
  myId: string;
  chat: Chat;
}

const previewComponents: Components = {
  p: ({ children }) => <span className="inline">{children}</span>,
  a: ({ children }) => <span className="text-blue-400">{children}</span>,
  strong: ({ children }) => <>{children}</>,
  em: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const isBlock: boolean = !!className?.includes("language-");
    if (isBlock) {
      return (
        <span className="inline-flex items-center gap-1 align-baseline">
          <LuTerminal className="w-3.5 h-3.5 translate-y-[1px]" /> Code
        </span>
      );
    }
    return (
      <code className="bg-muted px-1 rounded font-mono text-[0.9em] align-baseline">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <span className="inline">{children}</span>,
  ul: () => (
    <span className="inline-flex items-center gap-1 align-baseline">
      <LuList className="w-3.5 h-3.5 translate-y-[1px]" /> List
    </span>
  ),
  ol: () => (
    <span className="inline-flex items-center gap-1 align-baseline">
      <LuListOrdered className="w-3.5 h-3.5 translate-y-[1px]" /> List
    </span>
  ),
  table: () => (
    <span className="inline-flex items-center gap-1 align-baseline">
      <LuTable className="w-3.5 h-3.5 translate-y-[1px]" /> Table
    </span>
  ),
  blockquote: ({ children }) => (
    <span className="inline-flex items-center gap-1 align-baseline">
      <LuQuote className="w-3.5 h-3.5 rotate-180 translate-y-[1px]" />{" "}
      {children}
    </span>
  ),
  img: () => (
    <span className="inline-flex items-center gap-1 align-baseline">
      <LuImage className="w-3.5 h-3.5 translate-y-[1px]" /> Photo
    </span>
  ),
  br: () => <> </>,
};

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
  const [lastProcessedId, setLastProcessedId] = useState<string | null>(null);

  if (lastProcessedId !== message.id) {
    setLastProcessedId(message.id);
    setIsDecrypting(message.isEncrypted);
    setDecryptedText(null);
  }

  const senderId = message.sender.id;
  const senderPublicKey = message.sender.publicKey;
  const encryptionIv = message.encryptionIv;
  const isEncrypted = message.isEncrypted;
  const messageText = message.text;

  useEffect(() => {
    let isMounted: boolean = true;
    if (!isEncrypted) return;

    const performDecryption = async (): Promise<void> => {
      try {
        const myPrivKeyObj = await getPrivateKey(myId);
        const isMe: boolean = senderId === myId;
        let targetPublicKey: string | null | undefined = isMe
          ? null
          : senderPublicKey;

        if (isMe) {
          const otherMember = chat.members?.find((m) => m.user.id !== myId);
          targetPublicKey = otherMember?.user.publicKey;
        }

        if (!targetPublicKey && !isMe) {
          const userInCache = client.cache.readFragment<{ publicKey: string }>({
            id: client.cache.identify({ __typename: "User", id: senderId }),
            fragment: gql`
              fragment UserKey on User {
                publicKey
              }
            `,
          });
          targetPublicKey = userInCache?.publicKey;
        }

        if (!targetPublicKey || !myPrivKeyObj || !encryptionIv) {
          if (isMounted) {
            setDecryptedText("Encrypted");
            setIsDecrypting(false);
          }
          return;
        }

        const clearText: string = await decryptText(
          messageText,
          encryptionIv,
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
    return (): void => {
      isMounted = false;
    };
  }, [
    message.id,
    messageText,
    encryptionIv,
    isEncrypted,
    senderId,
    senderPublicKey,
    myId,
    chat.members,
    client.cache,
  ]);

  const rawContent: string | null = isEncrypted ? decryptedText : messageText;

  const content = useMemo(() => {
    if (!rawContent) return null;
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={previewComponents}
      >
        {rawContent}
      </ReactMarkdown>
    );
  }, [rawContent]);

  if (isDecrypting && !decryptedText) {
    return <Skeleton className="h-3 w-24 mt-1" />;
  }

  return (
    <div className="line-clamp-2 break-all overflow-hidden text-ellipsis leading-[1.2]">
      {content || (isEncrypted ? "Encrypted" : "")}
    </div>
  );
}
