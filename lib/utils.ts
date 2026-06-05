/**
 * Tiny classnames helper (no external dependency). Filters falsy values and
 * joins the rest with spaces.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Format a date as a short relative string, e.g. "3m ago", "just now". */
export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "never";
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

/** Format a number for compact display in cards. */
export function formatNumber(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

/** Title-case a metric / enum-ish string: "deviceId" -> "Device Id". */
export function humanize(s: string): string {
  return s
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Common unit suffix for well-known metric names. */
export function metricUnit(metric: string): string {
  const m = metric.toLowerCase();
  if (m.includes("temp")) return "°C";
  if (m.includes("humid")) return "%";
  if (m.includes("voltage") || m === "v") return "V";
  if (m.includes("current") || m === "a") return "A";
  if (m.includes("pressure")) return "hPa";
  if (m.includes("battery")) return "%";
  return "";
}
