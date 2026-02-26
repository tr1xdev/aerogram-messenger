import { formatDistanceToNowStrict } from "date-fns";

export function formatLastSeen(status: string): string {
  if (status === "online") return "online";

  const date = new Date(status);
  if (isNaN(date.getTime())) return "offline";

  return `last seen ${formatDistanceToNowStrict(date, { addSuffix: true })}`;
}
