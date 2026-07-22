import { memo, useState, type ReactElement } from "react";
import { FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttachmentPreview } from "./attachment-preview";
import type { messageBubble_message$data } from "../__generated__/messageBubble_message.graphql";

type Attachment = NonNullable<
  messageBubble_message$data["attachments"]
>[number];

interface PreviewAttachment {
  readonly url: string;
  readonly fileName: string;
  readonly fileSize: string | number | null;
  readonly contentType: string | null;
}

export const ImageAttachmentItem = memo(function ImageAttachmentItem({
  img,
  mappedAllFiles,
}: {
  readonly img: Attachment;
  readonly mappedAllFiles: readonly PreviewAttachment[];
}): ReactElement {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <AttachmentPreview
      allFiles={mappedAllFiles}
      file={{
        url: img.url ?? "",
        fileName: img.fileName ?? "image",
        fileSize: img.fileSize ?? 0,
        contentType: img.contentType ?? "image/jpeg",
      }}
    >
      <div className="relative cursor-pointer w-full h-full overflow-hidden group">
        {!isLoaded && (
          <div className="absolute inset-0 bg-zinc-300/70 animate-pulse z-10 aspect-video" />
        )}
        <img
          src={img.url ?? ""}
          alt={img.fileName ?? "Image attachment"}
          decoding="async"
          loading="lazy"
          className={cn(
            // h-full object-cover гарантирует одинаковую высоту и выравнивание в сетке коллажа
            "w-full h-full min-h-[140px] max-h-[350px] object-cover transition-all duration-200 block",
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
          )}
          draggable={false}
          onLoad={() => setIsLoaded(true)}
        />
      </div>
    </AttachmentPreview>
  );
});

ImageAttachmentItem.displayName = "ImageAttachmentItem";

export const FileAttachmentItem = memo(function FileAttachmentItem({
  file,
  mappedAllFiles,
  isMe,
}: {
  readonly file: Attachment;
  readonly mappedAllFiles: readonly PreviewAttachment[];
  readonly isMe: boolean;
}): ReactElement {
  return (
    <AttachmentPreview
      allFiles={mappedAllFiles}
      file={{
        url: file.url ?? "",
        fileName: file.fileName ?? "file",
        fileSize: file.fileSize ?? 0,
        contentType: file.contentType ?? "application/octet-stream",
      }}
    >
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl border cursor-pointer active:scale-[0.98] transition-all w-fit max-w-[260px]",
          isMe
            ? "bg-neutral-50/80 border-neutral-200"
            : "bg-background/60 border-border/50",
        )}
      >
        <div
          className={cn(
            "p-2 rounded-lg shrink-0",
            isMe ? "bg-zinc-100 text-zinc-600" : "bg-primary/10 text-primary",
          )}
        >
          <FileIcon size={20} />
        </div>

        <div className="flex flex-col overflow-hidden text-left min-w-0">
          <span className="text-[13px] font-semibold truncate max-w-[160px]">
            {file.fileName}
          </span>
          <span className="text-[11px] opacity-60">
            {Math.max(0.1, Number(file.fileSize || 0) / 1024).toFixed(1)} KB
          </span>
        </div>
      </div>
    </AttachmentPreview>
  );
});

FileAttachmentItem.displayName = "FileAttachmentItem";
