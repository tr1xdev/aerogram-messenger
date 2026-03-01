import { formatDividerDate } from "@/shared/lib/date";
import { cn } from "@/lib/utils";

interface DateDividerProps {
  date: string;
  isScrolling: boolean;
}

export function DateDivider({ date, isScrolling }: DateDividerProps) {
  return (
    <div className="flex justify-center w-full my-6 sticky top-2 z-30 pointer-events-none">
      <div
        className={cn(
          "bg-background/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-border/50 shadow-sm transition-all duration-300",
          "flex items-center justify-center min-w-[100px] pointer-events-auto",
          isScrolling
            ? "scale-105 shadow-md border-primary/20"
            : "scale-100 opacity-90",
        )}
      >
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          {formatDividerDate(date)}
        </span>
      </div>
    </div>
  );
}
