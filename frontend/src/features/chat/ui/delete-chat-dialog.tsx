import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DeleteChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (forEveryone: boolean) => void;
  displayName: string;
  isPrivate: boolean;
}

export function DeleteChatDialog({
  open,
  onOpenChange,
  onConfirm,
  displayName,
  isPrivate,
}: DeleteChatDialogProps) {
  const [forEveryone, setForEveryone] = useState(false);

  const handleConfirm = () => {
    onConfirm(forEveryone);
    setForEveryone(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setForEveryone(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete chat</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the chat with{" "}
            <strong>{displayName}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isPrivate && (
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="delete-everyone"
              checked={forEveryone}
              onCheckedChange={(checked: boolean) => setForEveryone(!!checked)}
            />
            <Label
              htmlFor="delete-everyone"
              className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Delete for everyone
            </Label>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
