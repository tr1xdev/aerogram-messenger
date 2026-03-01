import { SendHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export function MessageComposer({
  input,
  setInput,
  onSend,
  disabled,
}: MessageComposerProps) {
  return (
    <footer className="p-3 md:p-4 bg-background/95 backdrop-blur-sm border-t border-border/50">
      <form
        className="flex items-end gap-2.5 max-w-5xl mx-auto relative"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim() && !disabled) {
            onSend();
          }
        }}
      >
        <div className="relative flex-1 flex items-center">
          <Input
            placeholder="Message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={cn(
              "w-full min-h-[44px] rounded-[22px] bg-muted/30 px-5 py-3",
              "border border-border focus-visible:border-border/80 focus-visible:ring-1 focus-visible:ring-ring/20 focus-visible:bg-muted/60",
              "transition-all duration-200 placeholder:text-muted-foreground/60",
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={disabled || !input.trim()}
          size="icon"
          className={cn(
            "h-[44px] w-[44px] rounded-full shrink-0 transition-all active:scale-95",
            "border border-border shadow-sm",
            !input.trim()
              ? "bg-muted/50 text-muted-foreground/60 border-border/70"
              : "bg-primary text-primary-foreground border-primary",
          )}
        >
          <SendHorizontal className="h-5 w-5 ml-0.5" />
        </Button>
      </form>
    </footer>
  );
}
