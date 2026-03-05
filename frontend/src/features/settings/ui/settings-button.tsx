import { type LucideIcon, ChevronRight, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

interface SettingsButtonProps {
  icon?: LucideIcon;
  label: string;
  value?: string;
  onClick?: () => void;
  type?: "link" | "standard" | "copy" | "action";
  className?: string;
  isWarning?: boolean;
}

export const SettingsButton = ({
  icon: Icon,
  label,
  value,
  onClick,
  type = "standard",
  className,
  isWarning,
}: SettingsButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleAction = () => {
    if (type === "copy" && value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied to clipboard`, {
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    }
    onClick?.();
  };

  const isPlaceholder = !value && type === "copy";

  return (
    <button
      onClick={handleAction}
      className={cn(
        "group flex items-center w-full px-4 py-3.5 outline-none transition-all duration-200 text-left",
        "hover:bg-accent/50 active:scale-[0.995] border-b border-border/40 last:border-0",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex items-center justify-center h-8 w-8 rounded-lg transition-colors",
            type === "link" || type === "action" || isPlaceholder
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
            isWarning &&
              "bg-destructive/10 text-destructive group-hover:bg-destructive/20",
          )}
        >
          <Icon className="h-4.5 w-4.5 transition-transform group-hover:scale-110" />
        </div>
      )}
      <div className="flex items-center justify-between flex-1 min-w-0 ml-3">
        <div className="flex flex-col">
          <span
            className={cn(
              "text-[14px] font-medium tracking-tight transition-colors",
              type === "link" || isPlaceholder
                ? "text-primary"
                : "text-foreground/90 group-hover:text-foreground",
              isWarning && "text-destructive",
            )}
          >
            {label}
          </span>
          {type === "copy" && value && (
            <span className="text-[13px] text-muted-foreground font-normal tabular-nums truncate max-w-[240px]">
              {value}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {type === "standard" && value && (
            <span className="text-[13px] text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-md">
              {value}
            </span>
          )}
          {type === "copy" && value && (
            <div className="text-primary/40 group-hover:text-primary transition-colors">
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </div>
          )}
          {(type === "standard" || type === "link" || type === "action") &&
            !value && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/20 transition-transform group-hover:translate-x-0.5" />
            )}
        </div>
      </div>
    </button>
  );
};
