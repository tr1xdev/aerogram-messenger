import { formatDividerDate } from "@/shared/lib/date";

interface DateDividerProps {
  date: string;
}

export function DateDivider({ date }: DateDividerProps) {
  return (
    <div className="w-full flex justify-center my-6 select-none">
      <div className="bg-muted/20 px-4 py-1.5 rounded-full flex items-center justify-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 leading-none">
          {formatDividerDate(date)}
        </span>
      </div>
    </div>
  );
}
