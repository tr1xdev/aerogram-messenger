import {
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  format,
  differenceInMinutes,
} from "date-fns";

export function formatLastSeen(status: string, now: Date = new Date()): string {
  if (status === "online") return "online";
  if (!status || status === "offline") return "offline";

  const date: Date = new Date(status);
  if (isNaN(date.getTime())) return "offline";

  const diffMin: number = differenceInMinutes(now, date);
  if (diffMin < 1) return "last seen just now";

  return `last seen ${formatDistanceToNowStrict(date, { addSuffix: true })}`;
}

export function formatDividerDate(date: string | Date): string {
  const d: Date = new Date(date);

  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";

  const currentYear: number = new Date().getFullYear();
  const dateYear: number = d.getFullYear();

  return format(d, dateYear !== currentYear ? "d MMMM yyyy" : "d MMMM");
}
