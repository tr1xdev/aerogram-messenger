import { useMemo, type ReactElement } from "react";
import { FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttachmentPreview } from "./attachment-preview";
import type { messageBubble_message$data } from "../../__generated__/messageBubble_message.graphql";

type Attachment = NonNullable<
  messageBubble_message$data["attachments"]
>[number];

interface AttachmentListProps {
  attachments: readonly Attachment[];
  isMe: boolean;
}

export const AttachmentList = ({
  attachments,
  isMe,
}: AttachmentListProps): ReactElement | null => {
  const { images, files } = useMemo(
    () => ({
      images: attachments.filter(
        (a: Attachment): boolean =>
          a.contentType?.startsWith("image/") ?? false,
      ),
      files: attachments.filter(
        (a: Attachment): boolean =>
          !(a.contentType?.startsWith("image/") ?? false),
      ),
    }),
    [attachments],
  );

  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 mb-2 relative z-10 w-full max-w-full min-w-0">
      {images.length > 0 && (
        <div
          className={cn(
            "grid gap-1 rounded-xl w-full isolate overflow-hidden",
            images.length === 1 ? "grid-cols-1 max-w-[300px]" : "grid-cols-2",
          )}
        >
          {images.map(
            (img: Attachment): ReactElement => (
              <AttachmentPreview
                key={img.id}
                file={{
                  url: img.url ?? "",
                  fileName: img.fileName ?? "image",
                  fileSize: img.fileSize ?? "0",
                  contentType: img.contentType ?? "image/jpeg",
                }}
              >
                <div className="relative cursor-pointer aspect-square bg-zinc-100 overflow-hidden group touch-none">
                  <img
                    src={img.url ?? ""}
                    alt={img.fileName ?? ""}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    draggable={false}
                    loading="lazy"
                  />
                </div>
              </AttachmentPreview>
            ),
          )}
        </div>
      )}

      {files.map(
        (file: Attachment): ReactElement => (
          <AttachmentPreview
            key={file.id}
            file={{
              url: file.url ?? "",
              fileName: file.fileName ?? "file",
              fileSize: file.fileSize ?? "0",
              contentType: file.contentType ?? "application/octet-stream",
            }}
          >
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer active:scale-[0.98] transition-all",
                isMe
                  ? "bg-neutral-50/80 border-neutral-200"
                  : "bg-background/60 border-border",
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0",
                  isMe
                    ? "bg-zinc-100 text-zinc-600"
                    : "bg-primary/10 text-primary",
                )}
              >
                <FileIcon size={20} />
              </div>
              <div className="flex flex-col overflow-hidden text-left">
                <span className="text-[13px] font-semibold truncate max-w-[150px]">
                  {file.fileName}
                </span>
                <span className="text-[11px] opacity-60">
                  {(Number(file.fileSize) / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
          </AttachmentPreview>
        ),
      )}
    </div>
  );
};
