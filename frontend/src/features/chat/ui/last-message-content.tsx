import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import {
  LuTerminal,
  LuTable,
  LuImage,
  LuList,
  LuListOrdered,
  LuQuote,
} from "react-icons/lu";
import type { chatMenuItem_chat$data } from "./__generated__/chatMenuItem_chat.graphql";

interface LastMessageContentProps {
  message: NonNullable<chatMenuItem_chat$data["lastMessage"]>;
  myId: string;
  chat: chatMenuItem_chat$data;
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
        <span className="inline-flex items-center gap-1 align-baseline text-muted-foreground">
          <LuTerminal className="w-3.5 h-3.5 translate-y-px" /> Code
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
    <span className="inline-flex items-center gap-1 align-baseline text-muted-foreground">
      <LuList className="w-3.5 h-3.5 translate-y-px" /> List
    </span>
  ),
  ol: () => (
    <span className="inline-flex items-center gap-1 align-baseline text-muted-foreground">
      <LuListOrdered className="w-3.5 h-3.5 translate-y-px" /> List
    </span>
  ),
  table: () => (
    <span className="inline-flex items-center gap-1 align-baseline text-muted-foreground">
      <LuTable className="w-3.5 h-3.5 translate-y-px" /> Table
    </span>
  ),
  blockquote: ({ children }) => (
    <span className="inline-flex items-center gap-1 align-baseline italic opacity-80">
      <LuQuote className="w-3.5 h-3.5 rotate-180 translate-y-px" /> {children}
    </span>
  ),
  img: () => (
    <span className="inline-flex items-center gap-1 align-baseline text-muted-foreground">
      <LuImage className="w-3.5 h-3.5 translate-y-px" /> Photo
    </span>
  ),
  br: () => <> </>,
};

export function LastMessageContent({
  message,
}: LastMessageContentProps): React.ReactNode {
  const content = useMemo((): React.ReactNode => {
    const text: string | undefined | null = message?.text;
    if (!text) return null;

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={previewComponents}
      >
        {text}
      </ReactMarkdown>
    );
  }, [message?.text]);

  if (!message?.text) {
    return (
      <span className="text-muted-foreground/50 italic text-[13px]">
        No text content
      </span>
    );
  }

  return (
    <div
      className="line-clamp-2 break-all [word-break:break-word] overflow-hidden text-ellipsis leading-[1.3]"
      style={{
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: 2,
      }}
    >
      <span className="inline">{content}</span>
    </div>
  );
}
