import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <footer className="p-4 border-t bg-background">
      <form
        className="flex gap-2 max-w-4xl mx-auto"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        <Input
          placeholder="Message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={disabled || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </footer>
  );
}
