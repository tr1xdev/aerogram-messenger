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
  LuPaperclip,
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

function getAttachmentSummary(
  attachments: NonNullable<
    chatMenuItem_chat$data["lastMessage"]
  >["attachments"],
): string | null {
  if (!attachments || attachments.length === 0) return null;

  let imageCount = 0;
  let videoCount = 0;
  let audioCount = 0;
  let fileCount = 0;

  for (const att of attachments) {
    if (!att) continue;
    const type = att.type?.toLowerCase() || "";
    const contentType = att.contentType?.toLowerCase() || "";
    if (type === "image" || contentType.startsWith("image/")) {
      imageCount++;
    } else if (type === "video" || contentType.startsWith("video/")) {
      videoCount++;
    } else if (type === "audio" || contentType.startsWith("audio/")) {
      audioCount++;
    } else {
      fileCount++;
    }
  }

  const parts: string[] = [];
  if (imageCount > 0) {
    parts.push(`${imageCount} ${imageCount === 1 ? "Photo" : "Photos"}`);
  }
  if (videoCount > 0) {
    parts.push(`${videoCount} ${videoCount === 1 ? "Video" : "Videos"}`);
  }
  if (audioCount > 0) {
    parts.push(`${audioCount} ${audioCount === 1 ? "Audio" : "Audios"}`);
  }
  if (fileCount > 0) {
    parts.push(`${fileCount} ${fileCount === 1 ? "File" : "Files"}`);
  }

  return parts.join(", ");
}

export function LastMessageContent({
  message,
}: LastMessageContentProps): ReactNode {
  const content: ReactNode = useMemo((): ReactNode => {
    const text: string | undefined | null = message?.text;
    const attachments = message?.attachments;
    const attachmentSummary = getAttachmentSummary(attachments);

    const hasAttachments = attachments && attachments.length > 0;

    if (hasAttachments) {
      return (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <LuPaperclip className="w-3.5 h-3.5" />
          <span>{attachmentSummary}</span>
        </span>
      );
    }

    const hasText = !!text;
    if (!hasText) {
      return (
        <span className="text-muted-foreground/40 italic text-[13px]">
          No content
        </span>
      );
    }

    const previewText =
      text.length > 200 ? `${text.substring(0, 200)}...` : text;

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={previewComponents}
      >
        {previewText}
      </ReactMarkdown>
    );
  }, [message?.text, message?.attachments]);

  return (
    <div className="truncate w-full text-[13px] leading-snug text-muted-foreground">
      {content}
    </div>
  );
}
