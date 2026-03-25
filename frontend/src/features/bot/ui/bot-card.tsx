import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bot, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BotCardProps {
  id: string;
  username: string;
  firstName: string;
  description?: string;
}

export const BotCard: React.FC<BotCardProps> = ({
  id,
  username,
  firstName,
  description,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-4 px-5 py-5",
        "hover:bg-muted/30 cursor-pointer border-b border-muted/20 last:border-0 transition-all duration-200",
      )}
      onClick={(): void => {
        navigate({ to: `/bots/${id}` });
      }}
    >
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:border-primary/40 transition-colors">
          <Bot className="h-5 w-5 text-primary/60 group-hover:text-primary transition-colors" />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 leading-none">
            <span className="text-[15px] font-bold text-foreground group-hover:text-primary/90 transition-colors">
              {firstName}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground/40 font-medium tracking-tight pt-0.5">
              @{username}
            </span>
          </div>

          {description && (
            <p className="text-[13px] text-muted-foreground/80 line-clamp-1 font-medium mt-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-center">
        <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-all duration-300 group-hover:text-primary group-hover:translate-x-1" />
      </div>
    </div>
  );
};
