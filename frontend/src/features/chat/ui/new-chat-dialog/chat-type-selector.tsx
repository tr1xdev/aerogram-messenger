import { MessageSquare, Users, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

type ChatType = "PRIVATE" | "GROUP" | "CHANNEL";

interface ChatTypeOption {
  id: ChatType;
  title: string;
  description: string;
  icon: typeof MessageSquare;
}

interface ChatTypeSelectorProps {
  onSelect: (type: ChatType) => void;
}

const types: readonly ChatTypeOption[] = [
  {
    id: "PRIVATE",
    title: "New Private Chat",
    description: "Chat one-on-one with another user",
    icon: MessageSquare,
  },
  {
    id: "GROUP",
    title: "New Group",
    description: "Up to 500 members with shared history",
    icon: Users,
  },
  {
    id: "CHANNEL",
    title: "New Channel",
    description: "Unlimited subscribers and broadcasting",
    icon: Radio,
  },
] as const;

export function ChatTypeSelector({
  onSelect,
}: ChatTypeSelectorProps): ReactElement {
  return (
    <div className="grid gap-2 py-2">
      {types.map(
        (type: ChatTypeOption): ReactElement => (
          <button
            key={type.id}
            type="button"
            onClick={(): void => onSelect(type.id)}
            className={cn(
              "group flex items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all bg-card/50",
              "hover:bg-accent/60 hover:border-border/80 active:scale-[0.99]",
            )}
          >
            <div className="rounded-lg p-2 border bg-background text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
              <type.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium tracking-tight leading-none">
                {type.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground truncate">
                {type.description}
              </p>
            </div>
          </button>
        ),
      )}
    </div>
  );
}
