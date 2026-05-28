import { type ReactElement } from "react";
import { Copy, Forward, Reply, Pencil, Trash2, Info } from "lucide-react";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import type { messageBubble_message$data } from "../__generated__/messageBubble_message.graphql";
interface MessageContextMenuContentProps {
  message: messageBubble_message$data;
  isMe: boolean;
  canWrite: boolean;
  onReply?: (message: messageBubble_message$data) => void;
  onEdit?: (message: messageBubble_message$data) => void;
  onForward?: (message: messageBubble_message$data) => void;
  onDelete?: (id: string) => void;
  onShowInfo: () => void;
}

export const MessageContextMenuContent = ({
  message,
  isMe,
  canWrite,
  onReply,
  onEdit,
  onForward,
  onDelete,
  onShowInfo,
}: MessageContextMenuContentProps): ReactElement => {
  const handleCopy = (): void => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
    }
  };

  return (
    <ContextMenuContent className="w-48">
      {canWrite && (
        <ContextMenuItem onClick={() => onReply?.(message)}>
          <Reply className="mr-2 h-4 w-4" /> Reply
        </ContextMenuItem>
      )}
      <ContextMenuItem onClick={handleCopy}>
        <Copy className="mr-2 h-4 w-4" /> Copy
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onForward?.(message)}>
        <Forward className="mr-2 h-4 w-4" /> Forward
      </ContextMenuItem>

      {isMe && canWrite && (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onEdit?.(message)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => onDelete?.(message.id)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </ContextMenuItem>
        </>
      )}

      <ContextMenuSeparator />
      <ContextMenuItem onClick={onShowInfo}>
        <Info className="mr-2 h-4 w-4" /> Details
      </ContextMenuItem>
    </ContextMenuContent>
  );
};
