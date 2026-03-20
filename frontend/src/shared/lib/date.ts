import {
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  format,
  differenceInMinutes,
} from "date-fns";

export function formatLastSeen(status: string, now: Date = new Date()): string {
  if (status === "online") return "online";

  const date = new Date(status);
  if (isNaN(date.getTime())) return "offline";

  const diffMin = differenceInMinutes(now, date);

  if (diffMin < 1) {
    return "last seen just now";
  }

  return `last seen ${formatDistanceToNowStrict(date, { addSuffix: true })}`;
}

export function formatDividerDate(date: string | Date): string {
  const d = new Date(date);

  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";

  const currentYear = new Date().getFullYear();
  const dateYear = d.getFullYear();

  return format(d, dateYear !== currentYear ? "d MMMM yyyy" : "d MMMM");
}
