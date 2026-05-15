import { useMemo, memo, useState, type ReactElement } from "react";
import { FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttachmentPreview } from "./attachment-preview";
import type { messageBubble_message$data } from "../../__generated__/messageBubble_message.graphql";

type Attachment = NonNullable<
  messageBubble_message$data["attachments"]
>[number];

interface PreviewAttachment {
  readonly url: string;
  readonly fileName: string;
  readonly fileSize: string | number | null;
  readonly contentType: string | null;
}

interface AttachmentListProps {
  readonly attachments: readonly Attachment[];
  readonly isMe: boolean;
}

interface ReducerResult {
  readonly images: Attachment[];
  readonly files: Attachment[];
  readonly mappedAllFiles: PreviewAttachment[];
}

const ImageAttachmentItem = memo(function ImageAttachmentItem({
  img,
  mappedAllFiles,
}: {
  readonly img: Attachment;
  readonly mappedAllFiles: readonly PreviewAttachment[];
}): ReactElement {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  return (
    <AttachmentPreview
      allFiles={mappedAllFiles}
      file={{
        url: img.url ?? "",
        fileName: img.fileName ?? "image",
        fileSize: img.fileSize ?? "0",
        contentType: img.contentType ?? "image/jpeg",
      }}
    >
      <div className="relative cursor-pointer aspect-square w-full min-w-[120px] max-w-full bg-zinc-200 overflow-hidden group touch-none rounded-lg border border-black/5">
        {!isLoaded && (
          <div className="absolute inset-0 bg-zinc-300/70 backdrop-blur-[1px] animate-pulse z-10" />
        )}
        <img
          src={img.url ?? ""}
          alt={img.fileName ?? ""}
          decoding="async"
          loading="lazy"
          className={cn(
            "h-full w-full object-cover transition-all duration-200 will-change-[transform,opacity]",
            isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
          )}
          draggable={false}
          onLoad={(): void => setIsLoaded(true)}
        />
      </div>
    </AttachmentPreview>
  );
});

ImageAttachmentItem.displayName = "ImageAttachmentItem";

const FileAttachmentItem = memo(function FileAttachmentItem({
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
        fileSize: file.fileSize ?? "0",
        contentType: file.contentType ?? "application/octet-stream",
      }}
    >
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl border cursor-pointer active:scale-[0.98] transition-all transform-gpu will-change-transform w-full min-w-[200px] max-w-full",
          isMe
            ? "bg-neutral-50/80 border-neutral-200"
            : "bg-background/60 border-border",
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
        <div className="flex flex-col overflow-hidden text-left min-w-0 flex-1">
          <span className="text-[13px] font-semibold truncate max-w-[150px]">
            {file.fileName}
          </span>
          <span className="text-[11px] opacity-60">
            {(Number(file.fileSize || 0) / 1024).toFixed(1)} KB
          </span>
        </div>
      </div>
    </AttachmentPreview>
  );
});

FileAttachmentItem.displayName = "FileAttachmentItem";

export const AttachmentList = memo(function AttachmentList({
  attachments,
  isMe,
}: AttachmentListProps): ReactElement | null {
  const { images, files, mappedAllFiles } = useMemo((): ReducerResult => {
    const result: ReducerResult = {
      images: [],
      files: [],
      mappedAllFiles: [],
    };

    attachments.forEach((a: Attachment): void => {
      const url: string = a.url ?? "";
      const fileName: string = a.fileName ?? "file";
      const fileSize: string | number = a.fileSize ?? "0";
      const contentType: string = a.contentType ?? "application/octet-stream";

      if (contentType.startsWith("image/")) {
        result.images.push(a);
      } else {
        result.files.push(a);
      }

      result.mappedAllFiles.push({
        url,
        fileName,
        fileSize,
        contentType,
      });
    });

    return result;
  }, [attachments]);

  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 mb-2 relative z-10 w-full max-w-[320px] sm:max-w-[400px] min-w-0">
      {images.length > 0 && (
        <div
          className={cn(
            "grid gap-1 rounded-xl w-full isolate overflow-hidden transform-gpu",
            images.length === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
          style={{
            contain: "paint",
          }}
        >
          {images.map(
            (img: Attachment): ReactElement => (
              <ImageAttachmentItem
                key={img.id}
                img={img}
                mappedAllFiles={mappedAllFiles}
              />
            ),
          )}
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-col gap-1 w-full">
          {files.map(
            (file: Attachment): ReactElement => (
              <FileAttachmentItem
                key={file.id}
                file={file}
                mappedAllFiles={mappedAllFiles}
                isMe={isMe}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
});

AttachmentList.displayName = "AttachmentList";
