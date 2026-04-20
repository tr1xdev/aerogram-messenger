import { MessageSquare, Users, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

type ChatType = "PRIVATE" | "GROUP" | "CHANNEL";

interface ChatTypeOption {
  id: ChatType;
  title: string;
  description: string;
  icon: typeof MessageSquare;
  color: string;
  bg: string;
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
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "GROUP",
    title: "New Group",
    description: "Up to 500 members with shared history",
    icon: Users,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    id: "CHANNEL",
    title: "New Channel",
    description: "Unlimited subscribers and one-way broadcasting",
    icon: Radio,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
] as const;

export function ChatTypeSelector({
  onSelect,
}: ChatTypeSelectorProps): ReactElement {
  return (
    <div className="grid gap-3 py-4">
      {types.map(
        (type: ChatTypeOption): ReactElement => (
          <button
            key={type.id}
            type="button"
            onClick={(): void => onSelect(type.id)}
            className={cn(
              "group flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
              "hover:bg-accent hover:border-accent-foreground/20 active:scale-[0.98]",
            )}
          >
            <div
              className={cn(
                "rounded-lg p-2.5 transition-colors",
                type.bg,
                type.color,
              )}
            >
              <type.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium leading-none">{type.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {type.description}
              </p>
            </div>
          </button>
        ),
      )}
    </div>
  );
}
