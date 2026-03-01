import { formatDividerDate } from "@/shared/lib/date";

interface DateDividerProps {
  date: string;
}

export function DateDivider({ date }: DateDividerProps) {
  return (
    <div className="w-full flex justify-center my-6 select-none">
      <div className="bg-muted/20 px-3 py-1 rounded-full">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {formatDividerDate(date)}
        </span>
      </div>
    </div>
  );
}
