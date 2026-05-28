import { useMemo, type ReactNode } from "react";
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
  LuLink,
} from "react-icons/lu";
import type { chatMenuItem_chat$data } from "./__generated__/chatMenuItem_chat.graphql";

interface LastMessageContentProps {
  message: NonNullable<chatMenuItem_chat$data["lastMessage"]>;
  myId: string;
  chat: chatMenuItem_chat$data;
}

const previewComponents: Components = {
  a: ({ children }) => (
    <span className="inline-flex items-center gap-0.5 text-blue-500/80 underline decoration-blue-500/30">
      <LuLink className="w-3 h-3" />
      {children}
    </span>
  ),
  p: ({ children }) => <span className="inline">{children}</span>,
  strong: ({ children }) => (
    <span className="font-semibold text-foreground/90">{children}</span>
  ),
  em: ({ children }) => <span className="italic">{children}</span>,
  code: ({ className, children }) => {
    const isBlock: boolean = !!className?.includes("language-");
    if (isBlock) {
      return (
        <span className="inline-flex items-center gap-1 align-baseline text-muted-foreground">
          <LuTerminal className="w-3.5 h-3.5" /> Code
        </span>
      );
    }
    return (
      <code className="bg-muted/50 px-1 rounded font-mono text-[0.9em]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  ul: () => (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <LuList className="w-3.5 h-3.5" /> List
    </span>
  ),
  ol: () => (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <LuListOrdered className="w-3.5 h-3.5" /> List
    </span>
  ),
  table: () => (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <LuTable className="w-3.5 h-3.5" /> Table
    </span>
  ),
  blockquote: ({ children }) => (
    <span className="inline-flex items-center gap-1 italic opacity-70">
      <LuQuote className="w-3 h-3 rotate-180" /> {children}
    </span>
  ),
  img: () => (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <LuImage className="w-3.5 h-3.5" /> Photo
    </span>
  ),
  br: () => <> </>,
};

export function LastMessageContent({
  message,
}: LastMessageContentProps): ReactNode {
  const content: ReactNode = useMemo((): ReactNode => {
    const text: string | undefined | null = message?.text;
    if (!text) return null;

    const previewText: string =
      text.length > 200 ? `${text.substring(0, 200)}...` : text;

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={previewComponents}
      >
        {previewText}
      </ReactMarkdown>
    );
  }, [message?.text]);

  if (!message?.text) {
    return (
      <span className="text-muted-foreground/40 italic text-[13px]">
        No text content
      </span>
    );
  }

  return (
    <div className="truncate w-full text-[13px] leading-snug text-muted-foreground">
      {content}
    </div>
  );
}
