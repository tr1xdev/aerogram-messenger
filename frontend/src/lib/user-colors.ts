export interface ColorInfo {
  readonly start: string;
  readonly end: string;
  readonly text: string;
}

export const USER_COLORS: ReadonlyArray<ColorInfo> = [
  { start: "#ff516a", end: "#ff885e", text: "#ff516a" },
  { start: "#55d067", end: "#a4e063", text: "#55d067" },
  { start: "#ffa85c", end: "#ffcd6a", text: "#ffa85c" },
  { start: "#2a9ef1", end: "#72d5fd", text: "#2a9ef1" },
  { start: "#665fff", end: "#82b1ff", text: "#665fff" },
  { start: "#8d61ee", end: "#c382f3", text: "#8d61ee" },
  { start: "#f65a92", end: "#f999b0", text: "#f65a92" },
];

export function getUserColorInfo(
  userId?: string | null,
  fallback?: string | null,
): ColorInfo {
  const key: string = userId || fallback || "default";
  let hash: number = 0;

  for (let i: number = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index: number = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}
