import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

interface BotDeleteDialogProps {
  username: string;
  firstName: string;
  onConfirm: () => void;
}

export const BotDeleteDialog: React.FC<BotDeleteDialogProps> = ({
  username,
  firstName,
  onConfirm,
}) => {
  const [confirmValue, setConfirmValue] = React.useState<string>("");

  return (
    <AlertDialog
      onOpenChange={(open: boolean): void => {
        if (!open) setConfirmValue("");
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          variant="secondary"
          type="button"
          className="h-10 px-4 text-destructive hover:bg-destructive hover:text-destructive-foreground bg-destructive/5 rounded-xl text-[12px] font-bold transition-all active:scale-[0.98]"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Bot
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-[24px] border border-muted/20 p-8 shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">
            Terminate Bot?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13px] leading-relaxed">
            This action is permanent. All credentials for{" "}
            <span className="font-bold text-foreground">{firstName}</span> will
            be invalidated. Type{" "}
            <span className="font-mono font-bold text-destructive">
              @{username}
            </span>{" "}
            below to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Input
          value={confirmValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
            setConfirmValue(e.target.value)
          }
          placeholder={`@${username}`}
          className="mt-6 bg-muted/20 border-none h-11 rounded-xl text-center font-mono text-[13px] focus-visible:ring-1 focus-visible:ring-destructive/30"
        />

        <AlertDialogFooter className="mt-8 gap-3">
          <AlertDialogCancel className="rounded-xl border-none bg-muted/20 hover:bg-muted/30 text-[13px] font-bold h-11">
            Abort
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={confirmValue !== `@${username}`}
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl px-8 h-11 text-[13px] font-bold shadow-lg shadow-destructive/20 disabled:opacity-30 transition-all"
          >
            Confirm Termination
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
