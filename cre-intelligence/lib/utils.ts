import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a large number with K/M/B suffix */
export function formatNumber(
  val: number | null | undefined,
  opts: { prefix?: string; suffix?: string; decimals?: number } = {}
): string {
  if (val == null || isNaN(val)) return "N/A";
  const { prefix = "", suffix = "", decimals = 1 } = opts;
  const abs = Math.abs(val);
  if (abs >= 1e9) return `${prefix}${(val / 1e9).toFixed(decimals)}B${suffix}`;
  if (abs >= 1e6) return `${prefix}${(val / 1e6).toFixed(decimals)}M${suffix}`;
  if (abs >= 1e3) return `${prefix}${(val / 1e3).toFixed(decimals)}K${suffix}`;
  return `${prefix}${val.toFixed(decimals)}${suffix}`;
}

/** Format a percentage with sign */
export function formatPct(val: number | null | undefined, decimals = 1): string {
  if (val == null || isNaN(val)) return "N/A";
  return `${val.toFixed(decimals)}%`;
}

/** Compute % change between two values */
export function pctChange(a: number, b: number): number | null {
  if (!b || b === 0) return null;
  return ((a - b) / Math.abs(b)) * 100;
}

/** Export array of objects to CSV and trigger download */
export function exportCsv(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export a chart container as PNG using the browser print API */
export function exportChartPng(containerId: string, _filename: string) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const w = window.open("", "_blank");
  if (!w) return;
  // Use cloneNode instead of innerHTML to prevent XSS
  const clone = el.cloneNode(true) as HTMLElement;
  w.document.body.style.margin = "0";
  w.document.body.style.background = "#050505";
  w.document.body.appendChild(clone);
  w.document.close();
  w.focus();
  w.print();
  w.close();
}

/** Debounce helper */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

/** Friendly relative date */
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}
